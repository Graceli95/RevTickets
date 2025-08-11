import io
from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Response, Request
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer

from ....schemas.file import (
    FileUploadResponse, 
    AttachFilesRequest, 
    FileAttachmentResponse,
    BulkUploadResponse
)
from ....services.file_service import file_service
from ....utils.security import get_current_user

router = APIRouter(prefix="/files", tags=["files"])
security = HTTPBearer()


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Upload a single file
    
    - **file**: The file to upload (max 5MB)
    - **Returns**: File metadata and download URL
    """
    return await file_service.upload_file(file, str(current_user.id))


@router.post("/upload/bulk", response_model=BulkUploadResponse)
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    current_user = Depends(get_current_user)
):
    """
    Upload multiple files at once
    
    - **files**: List of files to upload (each max 5MB)
    - **Returns**: Results of all upload attempts
    """
    if len(files) > 5:  # MAX_FILES_PER_TICKET
        raise HTTPException(
            status_code=400, 
            detail="Too many files. Maximum 5 files allowed per upload."
        )
    
    result = await file_service.upload_multiple_files(files, str(current_user.id))
    return BulkUploadResponse(**result)


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    current_user = Depends(get_current_user)
):
    """
    Download a file by ID
    
    - **file_id**: The ID of the file to download
    - **Returns**: File content with appropriate headers
    """
    file_content, file_doc = await file_service.get_file(file_id, str(current_user.id))
    
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=file_doc.content_type,
        headers={
            "Content-Disposition": f"attachment; filename=\"{file_doc.filename}\"",
            "Content-Length": str(file_doc.size),
            "Cache-Control": "private, max-age=3600"
        }
    )


@router.get("/{file_id}/preview")
async def preview_file(
    file_id: str,
    current_user = Depends(get_current_user)
):
    """
    Preview a file (for images and PDFs)
    
    - **file_id**: The ID of the file to preview
    - **Returns**: File content for inline display
    """
    file_content, file_doc = await file_service.get_file(file_id, str(current_user.id))
    
    # Only allow preview for safe file types
    preview_types = {
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain'
    }
    
    if file_doc.content_type not in preview_types:
        raise HTTPException(
            status_code=400, 
            detail="File type not supported for preview"
        )
    
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=file_doc.content_type,
        headers={
            "Content-Disposition": f"inline; filename=\"{file_doc.filename}\"",
            "Content-Length": str(file_doc.size),
            "Cache-Control": "public, max-age=3600"
        }
    )


@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    current_user = Depends(get_current_user)
):
    """
    Delete a file
    
    - **file_id**: The ID of the file to delete
    - **Returns**: Success confirmation
    """
    success = await file_service.delete_file(file_id, str(current_user.id))
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"message": "File deleted successfully"}


@router.get("/{file_id}")
async def get_file_info(
    file_id: str,
    current_user = Depends(get_current_user)
):
    """
    Get file metadata
    
    - **file_id**: The ID of the file
    - **Returns**: File metadata
    """
    _, file_doc = await file_service.get_file(file_id, str(current_user.id))
    
    return {
        "id": file_id,
        "filename": file_doc.filename,
        "content_type": file_doc.content_type,
        "size": file_doc.size,
        "uploaded_at": file_doc.upload_date,
        "uploaded_by": file_doc.uploaded_by,
        "md5": file_doc.md5,
        "is_virus_scanned": file_doc.is_virus_scanned
    }


# Ticket file attachment routes
@router.post("/tickets/{ticket_id}/attach", response_model=List[FileAttachmentResponse])
async def attach_files_to_ticket(
    ticket_id: str,
    request: AttachFilesRequest,
    current_user = Depends(get_current_user)
):
    """
    Attach files to a ticket
    
    - **ticket_id**: The ID of the ticket
    - **file_ids**: List of file IDs to attach
    - **Returns**: List of attached file information
    """
    return await file_service.attach_files_to_ticket(
        ticket_id, 
        request.file_ids, 
        str(current_user.id)
    )


@router.get("/tickets/{ticket_id}", response_model=List[FileAttachmentResponse])
async def get_ticket_files(
    ticket_id: str,
    current_user = Depends(get_current_user)
):
    """
    Get all files attached to a ticket
    
    - **ticket_id**: The ID of the ticket
    - **Returns**: List of attached files
    """
    return await file_service.get_ticket_attachments(ticket_id)


@router.delete("/tickets/{ticket_id}/{file_id}")
async def detach_file_from_ticket(
    ticket_id: str,
    file_id: str,
    current_user = Depends(get_current_user)
):
    """
    Detach a file from a ticket
    
    - **ticket_id**: The ID of the ticket
    - **file_id**: The ID of the file to detach
    - **Returns**: Success confirmation
    """
    success = await file_service.detach_file_from_ticket(ticket_id, file_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    return {"message": "File detached from ticket successfully"}


