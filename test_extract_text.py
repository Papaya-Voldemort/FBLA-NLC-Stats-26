import pytest
from reportlab.pdfgen import canvas
from extract_text import extract_pdf_text

def create_dummy_pdf(path, text_content):
    """Creates a simple PDF with the given text content per page."""
    c = canvas.Canvas(path)
    for text in text_content:
        c.drawString(100, 750, text)
        c.showPage()
    c.save()

def test_extract_pdf_text_single_page(tmp_path):
    pdf_path = tmp_path / "single.pdf"
    txt_path = tmp_path / "output.txt"
    create_dummy_pdf(str(pdf_path), ["Hello, World!"])

    extract_pdf_text(str(pdf_path), str(txt_path))

    assert txt_path.exists()
    content = txt_path.read_text(encoding="utf-8")
    assert "--- PAGE 1 ---" in content
    assert "Hello, World!" in content

def test_extract_pdf_text_multi_page(tmp_path):
    pdf_path = tmp_path / "multi.pdf"
    txt_path = tmp_path / "output.txt"
    create_dummy_pdf(str(pdf_path), ["Page 1 Text", "Page 2 Text"])

    extract_pdf_text(str(pdf_path), str(txt_path))

    assert txt_path.exists()
    content = txt_path.read_text(encoding="utf-8")
    assert "--- PAGE 1 ---" in content
    assert "Page 1 Text" in content
    assert "--- PAGE 2 ---" in content
    assert "Page 2 Text" in content

def test_extract_pdf_text_file_not_found(tmp_path):
    pdf_path = tmp_path / "non_existent.pdf"
    txt_path = tmp_path / "output.txt"

    with pytest.raises(FileNotFoundError):
        extract_pdf_text(str(pdf_path), str(txt_path))
