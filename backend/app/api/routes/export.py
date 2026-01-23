"""
Export API Routes - Export search results to PDF.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Dict, Any
import io

from app.models.schemas import SearchResponse
from app.utils.logger import get_logger

logger = get_logger("api.export")
router = APIRouter()


@router.post("/export/pdf")
async def export_pdf(result: SearchResponse) -> StreamingResponse:
    """
    Export search results to a formatted PDF report.

    Args:
        result: Search result to export

    Returns:
        StreamingResponse with PDF file

    Raises:
        HTTPException: On PDF generation errors
    """
    try:
        logger.info(f"PDF export requested for: {result.drug_name}")

        # Import PDF generator (we'll create this utility next)
        from app.utils.pdf_generator import generate_pdf_report

        # Generate PDF
        pdf_buffer = generate_pdf_report(result)

        # Create filename
        filename = f"{result.drug_name.replace(' ', '_')}_repurposing_report.pdf"

        logger.info(f"PDF generated successfully: {filename}")

        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(pdf_buffer),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except ImportError as e:
        logger.error(f"PDF generator not available: {e}")
        raise HTTPException(
            status_code=501,
            detail="PDF export not yet implemented. Install reportlab: pip install reportlab"
        )

    except Exception as e:
        logger.error(f"PDF export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"PDF export failed: {str(e)}")


@router.post("/export/json")
async def export_json(result: SearchResponse) -> Dict[str, Any]:
    """
    Export search results as JSON (for downloading).

    Args:
        result: Search result to export

    Returns:
        Dictionary with download information
    """
    try:
        logger.info(f"JSON export requested for: {result.drug_name}")

        # Convert to dict and return
        result_dict = result.model_dump()

        return {
            "status": "success",
            "filename": f"{result.drug_name.replace(' ', '_')}_repurposing_report.json",
            "data": result_dict
        }

    except Exception as e:
        logger.error(f"JSON export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
