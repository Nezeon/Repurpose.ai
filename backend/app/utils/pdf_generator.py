"""
PDF Generator - Creates professional pharmaceutical research reports.
Uses ReportLab for PDF generation with brand watermarks, charts, and professional styling.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, NextPageTemplate,
    Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, HRFlowable, Flowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.graphics.shapes import Drawing, String, Line, Rect
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.legends import Legend
from reportlab.graphics.charts.textlabels import Label
from reportlab.pdfgen import canvas
from datetime import datetime
from io import BytesIO
from typing import List, Dict, Any
from collections import Counter
import re

from app.models.schemas import SearchResponse, IndicationResult, EvidenceItem
from app.utils.logger import get_logger

logger = get_logger("pdf_generator")


# =============================================================================
# BRAND COLOR SCHEME
# =============================================================================

# Primary Brand Colors
EY_YELLOW = colors.HexColor('#FFE600')
EY_GOLD = colors.HexColor('#FFC700')
EY_DARK = colors.HexColor('#1a1a2e')
EY_CHARCOAL = colors.HexColor('#2E2E38')

# Healthcare Accent Colors
HEALTH_TEAL = colors.HexColor('#00A8B5')
HEALTH_GREEN = colors.HexColor('#00C853')
HEALTH_MINT = colors.HexColor('#00E5A0')

# Neutral Colors
LIGHT_GRAY = colors.HexColor('#F5F5F5')
MEDIUM_GRAY = colors.HexColor('#9CA3AF')
DARK_GRAY = colors.HexColor('#4B5563')
WHITE = colors.white

# Confidence Score Colors
CONFIDENCE_HIGH = colors.HexColor('#00C853')
CONFIDENCE_MODERATE = colors.HexColor('#00A8B5')
CONFIDENCE_LOW = colors.HexColor('#FFE600')
CONFIDENCE_VERY_LOW = colors.HexColor('#FF4444')

# Professional Link Color
LINK_BLUE = colors.HexColor('#0077B6')

# Chart Colors
CHART_COLORS = [
    HEALTH_TEAL,
    EY_YELLOW,
    HEALTH_GREEN,
    colors.HexColor('#A855F7'),  # Purple
    colors.HexColor('#FF6B6B'),  # Coral
    colors.HexColor('#38BDF8'),  # Sky blue
]

# Source Badge Colors
SOURCE_COLORS = {
    'literature': HEALTH_TEAL,
    'clinical_trials': HEALTH_GREEN,
    'bioactivity': colors.HexColor('#A855F7'),
    'patent': EY_YELLOW,
    'internal': colors.HexColor('#FF6B6B'),
}


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def clean_markdown_for_pdf(text: str) -> str:
    """Convert markdown formatting to ReportLab-compatible HTML."""
    if not text:
        return ""

    # Remove markdown headers
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)

    # Convert **bold** to <b>bold</b>
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)

    # Convert *italic* to <i>italic</i>
    text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<i>\1</i>', text)

    # Convert bullet points
    text = re.sub(r'^[-*]\s+', '  - ', text, flags=re.MULTILINE)

    # Remove markdown links [text](url) -> text
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)

    # Find valid tags and preserve them
    valid_tags = re.findall(r'</?[bi]>', text)
    placeholders = {}
    for i, tag in enumerate(valid_tags):
        placeholder = f"__TAG_{i}__"
        placeholders[placeholder] = tag
        text = text.replace(tag, placeholder, 1)

    # Escape special characters
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')

    # Restore valid tags
    for placeholder, tag in placeholders.items():
        text = text.replace(placeholder, tag)

    return text


def get_confidence_color(score: float) -> colors.Color:
    """Get color based on confidence score."""
    if score >= 80:
        return CONFIDENCE_HIGH
    elif score >= 60:
        return CONFIDENCE_MODERATE
    elif score >= 40:
        return CONFIDENCE_LOW
    return CONFIDENCE_VERY_LOW


def get_confidence_label(score: float) -> str:
    """Get label based on confidence score."""
    if score >= 80:
        return "High"
    elif score >= 60:
        return "Moderate"
    elif score >= 40:
        return "Low"
    return "Very Low"


def _get_evidence_url(evidence: EvidenceItem) -> str:
    """Get URL from evidence item."""
    if evidence.url:
        return evidence.url

    if evidence.source == 'literature' and evidence.metadata.get('pmid'):
        return f"https://pubmed.ncbi.nlm.nih.gov/{evidence.metadata['pmid']}/"
    if evidence.source == 'clinical_trials' and evidence.metadata.get('nct_id'):
        return f"https://clinicaltrials.gov/study/{evidence.metadata['nct_id']}"
    if evidence.source == 'bioactivity' and evidence.metadata.get('target_chembl_id'):
        return f"https://www.ebi.ac.uk/chembl/target_report_card/{evidence.metadata['target_chembl_id']}/"
    if evidence.source == 'patent' and evidence.metadata.get('lens_id'):
        return f"https://www.lens.org/lens/patent/{evidence.metadata['lens_id']}"

    return ""


# =============================================================================
# PAGE DRAWING FUNCTIONS
# =============================================================================

def _draw_watermark(canvas_obj, doc):
    """Draw subtle diagonal watermark on each page."""
    canvas_obj.saveState()

    page_width, page_height = letter

    # Set watermark properties - very subtle
    canvas_obj.setFillColor(colors.HexColor('#D0D0D0'))
    canvas_obj.setFont('Helvetica-Bold', 50)

    # Draw diagonal watermarks
    try:
        canvas_obj.setFillAlpha(0.06)
    except AttributeError:
        pass  # Some PDF viewers don't support alpha

    watermark_text = "Repurpose.AI"

    for y_offset in range(-50, int(page_height) + 100, 180):
        for x_offset in range(-100, int(page_width) + 100, 280):
            canvas_obj.saveState()
            canvas_obj.translate(x_offset, y_offset)
            canvas_obj.rotate(35)
            canvas_obj.drawString(0, 0, watermark_text)
            canvas_obj.restoreState()

    canvas_obj.restoreState()


def _draw_header_footer(canvas_obj, doc):
    """Draw professional header and footer on each page."""
    canvas_obj.saveState()
    page_width, page_height = letter

    # Header - Yellow accent bar
    canvas_obj.setFillColor(EY_YELLOW)
    canvas_obj.rect(0, page_height - 35, page_width, 35, fill=1, stroke=0)

    # Header text - Brand name
    canvas_obj.setFillColor(EY_CHARCOAL)
    canvas_obj.setFont('Helvetica-Bold', 11)
    canvas_obj.drawString(0.75 * inch, page_height - 23, "Repurpose.AI")

    # Header text - Document type
    canvas_obj.setFont('Helvetica', 9)
    canvas_obj.drawRightString(page_width - 0.75 * inch, page_height - 23, "Drug Repurposing Analysis Report")

    # Footer line
    canvas_obj.setStrokeColor(EY_YELLOW)
    canvas_obj.setLineWidth(2)
    canvas_obj.line(0.75 * inch, 0.6 * inch, page_width - 0.75 * inch, 0.6 * inch)

    # Footer text - Confidential notice
    canvas_obj.setFillColor(MEDIUM_GRAY)
    canvas_obj.setFont('Helvetica', 7)
    canvas_obj.drawString(0.75 * inch, 0.4 * inch, "CONFIDENTIAL - For Research Purposes Only")

    # Page number
    canvas_obj.setFont('Helvetica', 9)
    canvas_obj.drawRightString(page_width - 0.75 * inch, 0.4 * inch, f"Page {doc.page}")

    canvas_obj.restoreState()


def _on_cover_page(canvas_obj, doc):
    """Draw only watermark on cover page (no header/footer)."""
    _draw_watermark(canvas_obj, doc)


def _on_content_page(canvas_obj, doc):
    """Draw watermark and header/footer on content pages."""
    _draw_watermark(canvas_obj, doc)
    _draw_header_footer(canvas_obj, doc)


# =============================================================================
# CHART CREATION FUNCTIONS
# =============================================================================

def create_evidence_pie_chart(evidence_list: List[EvidenceItem]) -> Drawing:
    """Create pie chart for evidence source distribution."""
    source_counts = Counter(e.source for e in evidence_list)

    if not source_counts:
        return None

    data = list(source_counts.values())
    labels = [s.replace('_', ' ').title() for s in source_counts.keys()]

    drawing = Drawing(380, 200)

    # Create pie chart
    pie = Pie()
    pie.x = 80
    pie.y = 25
    pie.width = 130
    pie.height = 130
    pie.data = data
    pie.labels = None  # We'll use legend instead
    pie.slices.strokeColor = WHITE
    pie.slices.strokeWidth = 2

    # Style slices
    for i in range(len(data)):
        pie.slices[i].fillColor = CHART_COLORS[i % len(CHART_COLORS)]
        if i == 0:
            pie.slices[i].popout = 8

    drawing.add(pie)

    # Add legend
    legend = Legend()
    legend.x = 240
    legend.y = 140
    legend.dx = 8
    legend.dy = 8
    legend.fontName = 'Helvetica'
    legend.fontSize = 9
    legend.boxAnchor = 'nw'
    legend.columnMaximum = 6
    legend.strokeWidth = 0
    legend.deltay = 12
    legend.dividerLines = 0

    legend.colorNamePairs = [
        (CHART_COLORS[i % len(CHART_COLORS)], f"{labels[i]} ({data[i]})")
        for i in range(len(labels))
    ]
    drawing.add(legend)

    # Title
    title = String(190, 185, 'Evidence Distribution by Source', fontName='Helvetica-Bold', fontSize=11, textAnchor='middle')
    drawing.add(title)

    return drawing


def create_confidence_bar_chart(indications: List[IndicationResult], max_items: int = 7) -> Drawing:
    """Create bar chart for top indication confidence scores."""
    if not indications:
        return None

    top_indications = indications[:max_items]
    scores = [ind.confidence_score for ind in top_indications]
    labels = [
        (ind.indication[:18] + '...') if len(ind.indication) > 18 else ind.indication
        for ind in top_indications
    ]

    drawing = Drawing(480, 220)

    # Create bar chart
    bc = VerticalBarChart()
    bc.x = 60
    bc.y = 50
    bc.height = 130
    bc.width = 380
    bc.data = [scores]
    bc.strokeColor = None
    bc.barWidth = 40
    bc.groupSpacing = 15

    # Category axis (X)
    bc.categoryAxis.labels.boxAnchor = 'ne'
    bc.categoryAxis.labels.dx = -5
    bc.categoryAxis.labels.dy = -5
    bc.categoryAxis.labels.angle = 25
    bc.categoryAxis.labels.fontName = 'Helvetica'
    bc.categoryAxis.labels.fontSize = 8
    bc.categoryAxis.categoryNames = labels
    bc.categoryAxis.strokeColor = MEDIUM_GRAY

    # Value axis (Y)
    bc.valueAxis.valueMin = 0
    bc.valueAxis.valueMax = 100
    bc.valueAxis.valueStep = 20
    bc.valueAxis.labels.fontName = 'Helvetica'
    bc.valueAxis.labels.fontSize = 8
    bc.valueAxis.strokeColor = MEDIUM_GRAY
    bc.valueAxis.gridStrokeColor = LIGHT_GRAY
    bc.valueAxis.gridStrokeWidth = 0.5
    bc.valueAxis.visibleGrid = 1

    # Color bars based on confidence
    for i, score in enumerate(scores):
        bc.bars[0, i].fillColor = get_confidence_color(score)

    drawing.add(bc)

    # Title
    title = String(250, 200, 'Top Indications by Confidence Score', fontName='Helvetica-Bold', fontSize=11, textAnchor='middle')
    drawing.add(title)

    return drawing


# =============================================================================
# SECTION BUILDERS
# =============================================================================

def _build_cover_page(result: SearchResponse, styles) -> List:
    """Build professional cover page."""
    elements = []

    # Spacing from top
    elements.append(Spacer(1, 1.8 * inch))

    # Yellow accent bar
    accent_data = [['', '']]
    accent_table = Table(accent_data, colWidths=[0.3 * inch, 6.2 * inch], rowHeights=[0.15 * inch])
    accent_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), EY_YELLOW),
        ('BACKGROUND', (1, 0), (1, 0), EY_GOLD),
    ]))
    elements.append(accent_table)
    elements.append(Spacer(1, 0.4 * inch))

    # Title style
    title_style = ParagraphStyle(
        'CoverTitle',
        fontSize=32,
        textColor=EY_CHARCOAL,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=38
    )

    elements.append(Paragraph("Drug Repurposing", title_style))
    elements.append(Paragraph("Analysis Report", title_style))
    elements.append(Spacer(1, 0.3 * inch))

    # Drug name
    drug_style = ParagraphStyle(
        'DrugName',
        fontSize=44,
        textColor=HEALTH_TEAL,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=30
    )
    elements.append(Paragraph(result.drug_name, drug_style))

    elements.append(Spacer(1, 0.8 * inch))

    # Key metrics table
    metrics_data = [
        ['METRIC', 'VALUE'],
        ['Repurposing Opportunities', str(len(result.ranked_indications))],
        ['Evidence Items Analyzed', str(len(result.all_evidence))],
        ['Data Sources Queried', str(len(set(e.source for e in result.all_evidence)))],
        ['Analysis Duration', f'{result.execution_time:.1f} seconds'],
    ]

    metrics_table = Table(metrics_data, colWidths=[3 * inch, 2.5 * inch])
    metrics_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), EY_CHARCOAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), EY_YELLOW),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        # Data rows
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 11),
        ('TEXTCOLOR', (0, 1), (0, -1), EY_CHARCOAL),
        ('TEXTCOLOR', (1, 1), (1, -1), DARK_GRAY),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        # Styling
        ('PADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, LIGHT_GRAY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
    ]))
    elements.append(metrics_table)

    elements.append(Spacer(1, 1.5 * inch))

    # Footer info
    footer_style = ParagraphStyle('CoverFooter', fontSize=10, textColor=MEDIUM_GRAY, alignment=TA_CENTER)
    elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')}", footer_style))
    elements.append(Spacer(1, 0.1 * inch))

    powered_style = ParagraphStyle('PoweredBy', fontSize=9, textColor=HEALTH_TEAL, alignment=TA_CENTER)
    elements.append(Paragraph("Powered by Repurpose.AI | Confidential Research Document", powered_style))

    elements.append(PageBreak())

    return elements


def _build_executive_summary(result: SearchResponse, styles) -> List:
    """Build executive summary section."""
    elements = []

    # Section heading
    heading_style = ParagraphStyle(
        'Heading',
        fontSize=18,
        textColor=EY_CHARCOAL,
        fontName='Helvetica-Bold',
        spaceBefore=10,
        spaceAfter=5
    )
    elements.append(Paragraph("Executive Summary", heading_style))
    elements.append(HRFlowable(width="25%", thickness=3, color=EY_YELLOW, spaceAfter=15))

    # Key findings box
    if result.ranked_indications:
        top = result.ranked_indications[0]
        conf_color = get_confidence_color(top.confidence_score)

        findings_data = [
            ['Key Finding', 'Details'],
            ['Top Opportunity', top.indication],
            ['Confidence Score', f'{top.confidence_score:.1f}/100 ({get_confidence_label(top.confidence_score)})'],
            ['Supporting Evidence', f'{top.evidence_count} items'],
            ['Data Sources', ', '.join(top.supporting_sources)],
        ]

        findings_table = Table(findings_data, colWidths=[2 * inch, 4.5 * inch])
        findings_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), EY_CHARCOAL),
            ('TEXTCOLOR', (0, 0), (-1, 0), EY_YELLOW),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 1), (0, -1), LIGHT_GRAY),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (1, 2), (1, 2), conf_color),
            ('FONTNAME', (1, 2), (1, 2), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, MEDIUM_GRAY),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(findings_table)
        elements.append(Spacer(1, 0.25 * inch))

    # AI Synthesis
    if result.synthesis:
        subhead_style = ParagraphStyle(
            'Subheading',
            fontSize=13,
            textColor=EY_CHARCOAL,
            fontName='Helvetica-Bold',
            spaceBefore=15,
            spaceAfter=8
        )
        elements.append(Paragraph("AI Analysis", subhead_style))

        body_style = ParagraphStyle(
            'Body',
            fontSize=10,
            textColor=DARK_GRAY,
            alignment=TA_JUSTIFY,
            leading=14,
            spaceAfter=6
        )

        paragraphs = result.synthesis.split('\n\n')
        for para in paragraphs[:6]:  # Limit to 6 paragraphs
            if para.strip():
                clean_para = clean_markdown_for_pdf(para.strip())
                try:
                    elements.append(Paragraph(clean_para, body_style))
                except:
                    plain_para = re.sub(r'<[^>]+>', '', clean_para)
                    elements.append(Paragraph(plain_para, body_style))

    elements.append(PageBreak())
    return elements


def _build_visualizations(result: SearchResponse) -> List:
    """Build visualizations section with charts."""
    elements = []

    heading_style = ParagraphStyle(
        'Heading',
        fontSize=18,
        textColor=EY_CHARCOAL,
        fontName='Helvetica-Bold',
        spaceBefore=10,
        spaceAfter=5
    )
    elements.append(Paragraph("Data Visualizations", heading_style))
    elements.append(HRFlowable(width="25%", thickness=3, color=EY_YELLOW, spaceAfter=20))

    # Evidence distribution pie chart
    pie_chart = create_evidence_pie_chart(result.all_evidence)
    if pie_chart:
        elements.append(pie_chart)
        elements.append(Spacer(1, 0.4 * inch))

    # Confidence bar chart
    bar_chart = create_confidence_bar_chart(result.ranked_indications)
    if bar_chart:
        elements.append(bar_chart)

    elements.append(PageBreak())
    return elements


def _build_indications_section(result: SearchResponse, styles) -> List:
    """Build top repurposing opportunities section."""
    elements = []

    heading_style = ParagraphStyle(
        'Heading',
        fontSize=18,
        textColor=EY_CHARCOAL,
        fontName='Helvetica-Bold',
        spaceBefore=10,
        spaceAfter=5
    )
    elements.append(Paragraph("Top Repurposing Opportunities", heading_style))
    elements.append(HRFlowable(width="25%", thickness=3, color=EY_YELLOW, spaceAfter=15))

    if not result.ranked_indications:
        body_style = ParagraphStyle('Body', fontSize=10, textColor=DARK_GRAY)
        elements.append(Paragraph("No repurposing opportunities identified.", body_style))
        return elements

    # Styles for indication cards
    indication_title_style = ParagraphStyle(
        'IndicationTitle',
        fontSize=12,
        textColor=EY_CHARCOAL,
        fontName='Helvetica-Bold'
    )

    detail_style = ParagraphStyle(
        'Detail',
        fontSize=9,
        textColor=DARK_GRAY,
        spaceAfter=4
    )

    link_style = ParagraphStyle(
        'Link',
        fontSize=9,
        textColor=LINK_BLUE,
        spaceAfter=3,
        leftIndent=10
    )

    for i, indication in enumerate(result.ranked_indications[:10], 1):
        conf_color = get_confidence_color(indication.confidence_score)
        conf_label = get_confidence_label(indication.confidence_score)

        # Indication header row
        header_data = [[
            Paragraph(f"<b>{i}. {indication.indication}</b>", indication_title_style),
            Paragraph(f"<b>{indication.confidence_score:.1f}/100</b> ({conf_label})",
                     ParagraphStyle('Score', fontSize=11, textColor=conf_color, fontName='Helvetica-Bold', alignment=TA_RIGHT))
        ]]

        header_table = Table(header_data, colWidths=[4.5 * inch, 2 * inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(header_table)

        # Details
        sources_text = ', '.join(indication.supporting_sources)
        elements.append(Paragraph(f"<b>Evidence:</b> {indication.evidence_count} items | <b>Sources:</b> {sources_text}", detail_style))

        # Top evidence items
        for j, evidence in enumerate(indication.evidence_items[:3], 1):
            url = _get_evidence_url(evidence)
            title = evidence.title or evidence.metadata.get('title', '')
            title_text = (title[:70] + '...') if len(title) > 70 else title
            title_text = clean_markdown_for_pdf(title_text) if title_text else 'Untitled'

            source_badge = f"[{evidence.source.replace('_', ' ').title()}]"

            if url:
                link_text = f'{j}. <b>{source_badge}</b> <link href="{url}" color="#0077B6"><u>{title_text}</u></link>'
            else:
                link_text = f'{j}. <b>{source_badge}</b> {title_text}'

            try:
                elements.append(Paragraph(link_text, link_style))
            except:
                elements.append(Paragraph(f'{j}. {source_badge} {re.sub(r"<[^>]+>", "", title_text)}', link_style))

        elements.append(Spacer(1, 0.2 * inch))

    elements.append(PageBreak())
    return elements


def _build_evidence_sources(result: SearchResponse, styles) -> List:
    """Build evidence sources summary section."""
    elements = []

    heading_style = ParagraphStyle(
        'Heading',
        fontSize=18,
        textColor=EY_CHARCOAL,
        fontName='Helvetica-Bold',
        spaceBefore=10,
        spaceAfter=5
    )
    elements.append(Paragraph("Evidence Sources Summary", heading_style))
    elements.append(HRFlowable(width="25%", thickness=3, color=EY_YELLOW, spaceAfter=15))

    # Source count table
    source_counts = Counter(e.source for e in result.all_evidence)

    table_data = [['Data Source', 'Evidence Count', 'Percentage']]
    total = sum(source_counts.values())

    for source, count in sorted(source_counts.items(), key=lambda x: x[1], reverse=True):
        source_name = source.replace('_', ' ').title()
        percentage = (count / total * 100) if total > 0 else 0
        table_data.append([source_name, str(count), f'{percentage:.1f}%'])

    table_data.append(['TOTAL', str(total), '100%'])

    source_table = Table(table_data, colWidths=[3 * inch, 1.5 * inch, 1.5 * inch])
    source_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), EY_CHARCOAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), EY_YELLOW),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, -1), (-1, -1), LIGHT_GRAY),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, MEDIUM_GRAY),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [WHITE, LIGHT_GRAY]),
    ]))
    elements.append(source_table)
    elements.append(Spacer(1, 0.3 * inch))

    # Evidence links by source
    subhead_style = ParagraphStyle(
        'Subheading',
        fontSize=13,
        textColor=EY_CHARCOAL,
        fontName='Helvetica-Bold',
        spaceBefore=15,
        spaceAfter=8
    )
    elements.append(Paragraph("Evidence Links", subhead_style))

    body_style = ParagraphStyle('Body', fontSize=9, textColor=DARK_GRAY, spaceAfter=4)
    link_style = ParagraphStyle('Link', fontSize=9, textColor=LINK_BLUE, spaceAfter=3, leftIndent=15)

    elements.append(Paragraph("Direct links to original sources for verification:", body_style))
    elements.append(Spacer(1, 0.1 * inch))

    evidence_by_source = {}
    for evidence in result.all_evidence[:40]:
        source = evidence.source
        if source not in evidence_by_source:
            evidence_by_source[source] = []
        evidence_by_source[source].append(evidence)

    source_title_style = ParagraphStyle('SourceTitle', fontSize=10, textColor=EY_CHARCOAL, fontName='Helvetica-Bold', spaceBefore=8)

    for source, evidences in evidence_by_source.items():
        source_name = source.replace('_', ' ').title()
        badge_color = SOURCE_COLORS.get(source, MEDIUM_GRAY)
        elements.append(Paragraph(f"{source_name}", source_title_style))

        for evidence in evidences[:5]:
            url = _get_evidence_url(evidence)
            title = evidence.title or evidence.metadata.get('title', 'Untitled')
            title_text = (title[:60] + '...') if len(title) > 60 else title
            title_text = clean_markdown_for_pdf(title_text)

            if url:
                link_text = f'<link href="{url}" color="#0077B6"><u>{title_text}</u></link>'
            else:
                link_text = title_text

            try:
                elements.append(Paragraph(f"- {link_text}", link_style))
            except:
                elements.append(Paragraph(f"- {re.sub(r'<[^>]+>', '', title_text)}", link_style))

        elements.append(Spacer(1, 0.05 * inch))

    return elements


def _build_footer(styles) -> List:
    """Build document footer."""
    elements = []

    elements.append(Spacer(1, 0.5 * inch))
    elements.append(HRFlowable(width="100%", thickness=1, color=LIGHT_GRAY, spaceAfter=10))

    footer_style = ParagraphStyle(
        'Footer',
        fontSize=8,
        textColor=MEDIUM_GRAY,
        alignment=TA_CENTER,
        leading=10
    )

    footer_text = (
        "This report was automatically generated by Repurpose.AI - Drug Repurposing Platform. "
        "The information provided is for research purposes only and should be validated "
        "through proper clinical and regulatory channels before any therapeutic decisions."
    )
    elements.append(Paragraph(footer_text, footer_style))

    elements.append(Spacer(1, 0.1 * inch))

    timestamp_style = ParagraphStyle('Timestamp', fontSize=8, textColor=HEALTH_TEAL, alignment=TA_CENTER)
    elements.append(Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S UTC')}", timestamp_style))

    return elements


# =============================================================================
# MAIN PDF GENERATION FUNCTION
# =============================================================================

def generate_pdf_report(result: SearchResponse) -> bytes:
    """
    Generate a professional PDF report from search results.

    Args:
        result: Search results to include in report

    Returns:
        PDF file as bytes
    """
    try:
        logger.info(f"Generating professional PDF report for: {result.drug_name}")

        buffer = BytesIO()
        page_width, page_height = letter

        # Create document with custom templates
        doc = BaseDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.9 * inch,
            bottomMargin=0.75 * inch,
            title=f"Drug Repurposing Report - {result.drug_name}",
            author="Repurpose.AI",
            subject="Drug Repurposing Analysis"
        )

        # Define frames
        frame = Frame(
            doc.leftMargin,
            doc.bottomMargin,
            doc.width,
            doc.height,
            id='normal'
        )

        # Page templates
        cover_template = PageTemplate(id='cover', frames=frame, onPage=_on_cover_page)
        content_template = PageTemplate(id='content', frames=frame, onPage=_on_content_page)

        doc.addPageTemplates([cover_template, content_template])

        # Get base styles
        styles = getSampleStyleSheet()

        # Build document content
        story = []

        # Cover page
        story.extend(_build_cover_page(result, styles))

        # Switch to content template
        story.append(NextPageTemplate('content'))

        # Executive summary
        story.extend(_build_executive_summary(result, styles))

        # Visualizations
        story.extend(_build_visualizations(result))

        # Top indications
        story.extend(_build_indications_section(result, styles))

        # Evidence sources
        story.extend(_build_evidence_sources(result, styles))

        # Footer
        story.extend(_build_footer(styles))

        # Build PDF
        doc.build(story)

        pdf_bytes = buffer.getvalue()
        buffer.close()

        logger.info(f"Professional PDF report generated successfully ({len(pdf_bytes)} bytes)")
        return pdf_bytes

    except Exception as e:
        logger.error(f"PDF generation failed: {e}", exc_info=True)
        raise
