import pypdf

def extract_pdf_text(pdf_path, txt_path):
    print(f"Reading {pdf_path}...")
    reader = pypdf.PdfReader(pdf_path)
    num_pages = len(reader.pages)
    print(f"Total pages: {num_pages}")
    
    full_text = []
    for i in range(num_pages):
        page = reader.pages[i]
        text = page.extract_text()
        full_text.append(f"--- PAGE {i+1} ---\n{text}\n")
    
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(full_text))
    print(f"Successfully extracted text to {txt_path}")

if __name__ == "__main__":
    extract_pdf_text("data.pdf", "extracted_text.txt")
