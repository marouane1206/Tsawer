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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

    setLoading(true);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        formData.append("file", blob, "image.jpg");
      } else {
        formData.append("file", {
          uri: selectedImage,
          type: "image/jpeg",
          name: "image.jpg",
        } as any);
      }

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

      if (response.data.output_file) {
        const downloadUrl = `${API_CONFIG.BASE_URL}/download/${response.data.output_file}`;
        setProcessedImage(downloadUrl);
        Alert.alert("Success", "Background removed successfully!");
      }
    } catch (error: any) {
      console.error("Error removing background:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Failed to remove background. Please try again.";
      Alert.alert("Error", errorMessage);
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
              onPress={removeBackground}
              disabled={loading}
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
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Background Removed</Text>
          <Image source={{ uri: processedImage }} style={styles.image} />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={downloadImage}>
              <Text style={styles.buttonText}>💾 Download Result</Text>
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
    boxShadow: "0px 2px 3.84px rgba(0, 0, 0, 0.25)",
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
    pointerEvents: "none",
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
    resizeMode: "contain",
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
});
