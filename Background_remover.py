from rembg import remove
from PIL import Image

input_path = input("Enter the path to the input image file: ")
output_path = input("Enter the path for the output image file (e.g., output.png): ")

try:
    with open(input_path, 'rb') as i:
        with open(output_path, 'wb') as o:
            input_data = i.read()
            output_data = remove(input_data)
            o.write(output_data)
    print(f'Background removed and saved to {output_path}')
except FileNotFoundError:
    print(f"Error: The file at {input_path} was not found. Please check the path and try again.")
except Exception as e:
    print(f"An error occurred: {e}")

