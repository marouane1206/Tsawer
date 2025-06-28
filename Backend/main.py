from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove
import os
import uuid
from pathlib import Path

app = FastAPI(title="Background Remover", description="Remove backgrounds from images using AI")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files (if you decide to serve a simple HTML page from here later)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/remove-background/")
async def remove_background(file: UploadFile = File(...)):
    """Remove background from uploaded image"""
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        input_path = UPLOAD_DIR / f"{file_id}_input{Path(file.filename).suffix}"
        output_path = UPLOAD_DIR / f"{file_id}_output.png"
        
        # Save uploaded file
        with open(input_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Remove background
        with open(input_path, "rb") as input_file:
            input_data = input_file.read()
            output_data = remove(input_data)
        
        # Save output file
        with open(output_path, "wb") as output_file:
            output_file.write(output_data)
        
        # Clean up input file
        os.remove(input_path)
        
        return {"message": "Background removed successfully", "output_file": output_path.name}
    
    except Exception as e:
        # Clean up files on error
        if input_path.exists():
            os.remove(input_path)
        if output_path.exists():
            os.remove(output_path)
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download processed image"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="image/png"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
