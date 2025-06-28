import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { API_CONFIG } from "../../config";

interface ApiResponse {
  message: string;
  output_file: string;
}

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Corrected from [\"images\"]
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setProcessedImage(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error("Error picking image:", error);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera is required!"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setProcessedImage(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
      console.error("Error taking photo:", error);
    }
  };

  const removeBackground = async () => {
    if (!selectedImage) {
      Alert.alert("No Image", "Please select an image first");
      return;
    }

    console.log("Starting background removal...");
    console.log("API URL:", `${API_CONFIG.BASE_URL}/remove-background/`);
    setLoading(true);

    try {
      // Test backend connection first
      const testResponse = await fetch(`${API_CONFIG.BASE_URL}/`, {
        method: "GET",
      });
      console.log("Backend connection test:", testResponse.status);

      const formData = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        formData.append("file", blob, "image.jpg");
        console.log("Web: File added to FormData");
      } else {
        formData.append("file", {
          uri: selectedImage,
          type: "image/jpeg",
          name: "image.jpg",
        } as any);
        console.log("Mobile: File added to FormData");
      }

      console.log("Sending request to backend...");
      const response = await axios.post<ApiResponse>(
        `${API_CONFIG.BASE_URL}/remove-background/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: API_CONFIG.TIMEOUT,
        }
      );

      console.log("Response received:", response.data);
      if (response.data?.output_file) {
        const filename = response.data.output_file.split('/').pop() || response.data.output_file;
        const downloadUrl = `${API_CONFIG.BASE_URL}/download/${filename}`;
        console.log("Setting processed image URL:", downloadUrl);
        setProcessedImage(downloadUrl);
        Alert.alert("Success", "Background removed successfully!");
      } else {
        Alert.alert("Error", "No output file received from server");
      }
    } catch (error: any) {
      console.error("Error removing background:", error);
      let errorMessage = "Failed to remove background. ";

      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("Network Error")
      ) {
        errorMessage +=
          "Cannot connect to server at " +
          API_CONFIG.BASE_URL +
          ". Please check if the backend is running on port 8000.";
      } else if (error.response) {
        errorMessage +=
          error.response?.data?.detail ||
          `Server error: ${error.response.status}`;
      } else {
        errorMessage += error.message || "Unknown error occurred.";
      }

      Alert.alert("Connection Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!processedImage) {
      Alert.alert("Error", "No processed image to download");
      return;
    }

    try {
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = processedImage;
        link.download = "background_removed.png";
        link.click();
      } else {
        const downloadResumable = FileSystem.createDownloadResumable(
          processedImage,
          FileSystem.documentDirectory + "background_removed.png"
        );

        const result = await downloadResumable.downloadAsync();
        if (result?.uri) {
          Alert.alert("Success", `Image saved to ${result.uri}`);
        } else {
          throw new Error("Download failed - no file URI returned");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to download image");
      console.error("Error downloading image:", error);
    }
  };

  const resetApp = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.title}>🎨 Background Remover</Text>
        <Text style={styles.subtitle}>
          Remove backgrounds from images using AI
        </Text>
      </View>

      {!selectedImage && !processedImage && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>📁 Choose from Gallery</Text>
          </TouchableOpacity>

          {Platform.OS !== "web" && (
            <TouchableOpacity style={styles.button} onPress={takePhoto}>
              <Text style={styles.buttonText}>📷 Take Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {selectedImage && (
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Selected Image</Text>
          <Image source={{ uri: selectedImage }} style={styles.image} />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={loading ? undefined : removeBackground}
              activeOpacity={loading ? 1 : 0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>✨ Remove Background</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={resetApp}>
              <Text style={styles.secondaryButtonText}>🔄 Start Over</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Processing your image...</Text>
        </View>
      )}

      {processedImage && (
        <View style={styles.comparisonSection}>
          <Text style={styles.sectionTitle}>Comparison</Text>

          <View style={styles.imageComparisonContainer}>
            <View style={styles.imageWrapper}>
              <Text style={styles.imageLabel}>Original</Text>
              <Image
                source={{ uri: selectedImage || '' }}
                style={styles.comparisonImage}
              />
            </View>

            <View style={styles.imageWrapper}>
              <Text style={styles.imageLabel}>Background Removed</Text>
              <Image
                source={{ uri: processedImage || '' }}
                style={styles.comparisonImage}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={downloadImage}>
              <Text style={styles.buttonText}>✅ Accept & Download</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={resetApp}>
              <Text style={styles.secondaryButtonText}>🔄 Process Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f7fa",
    padding: 20,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  buttonContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  button: {
    backgroundColor: "#667eea",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 10,
    minWidth: 200,
    alignItems: "center",
    // Removed shadow* properties and replaced with boxShadow for web compatibility
    // For native, you might need to keep elevation or use platform-specific shadows
    elevation: 5, // Android shadow
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 10,
    minWidth: 200,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#667eea",
  },
  secondaryButtonText: {
    color: "#667eea",
    fontSize: 16,
    fontWeight: "600",
  },
  imageSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 15,
    marginBottom: 20,
    resizeMode: "contain" as const,
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  comparisonSection: {
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  imageComparisonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  imageWrapper: {
    alignItems: "center",
    width: 280,
    margin: 10,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  comparisonImage: {
    width: 280,
    height: 280,
    borderRadius: 15,
    resizeMode: "contain" as const,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
});
