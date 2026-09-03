import os
from PIL import Image, ImageDraw, ImageFont

img_dir = r"D:\Sviluppo\superset-plugin-chart-stratum-heatmap\src\images"
os.makedirs(img_dir, exist_ok=True)

# 1. Genera thumbnail.png (Tema Chiaro 400x300)
def generate_thumbnail_light():
    w, h = 400, 300
    img = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Griglia 7 colonne (giorni) x 6 righe (fasce orarie)
    cols = 7
    rows = 6
    margin_x = 40
    margin_y = 35
    cell_w = (w - margin_x * 2) // cols
    cell_h = (h - margin_y * 2 - 40) // rows

    palette = [
        (238, 244, 249),  # #eef4f9
        (188, 213, 234),  # #bcd5ea
        (122, 168, 207),  # #7aa8cf
        (58, 106, 155),   # #3a6a9b
        (28, 61, 94)      # #1c3d5e
    ]

    # Matrice di intensità simulata
    pattern = [
        [0, 0, 1, 3, 1, 0, 0],
        [0, 1, 2, 4, 2, 0, 0],
        [1, 2, 3, 4, 3, 1, 0],
        [1, 1, 2, 3, 2, 0, 0],
        [0, 1, 1, 2, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
    ]

    for r in range(rows):
        for c in range(cols):
            x0 = margin_x + c * cell_w
            y0 = margin_y + r * cell_h
            x1 = x0 + cell_w - 3
            y1 = y0 + cell_h - 3
            intensity = pattern[r][c]
            color = palette[intensity]
            draw.rounded_rectangle([x0, y0, x1, y1], radius=4, fill=color)

    # VisualMap Slider mockup in basso
    vm_y = h - 35
    vm_w = 180
    vm_h = 10
    vm_x = (w - vm_w) // 2
    for i in range(vm_w):
        factor = i / vm_w
        pal_idx = int(factor * (len(palette) - 1))
        draw.line([(vm_x + i, vm_y), (vm_x + i, vm_y + vm_h)], fill=palette[pal_idx])
    draw.rectangle([vm_x, vm_y, vm_x + vm_w, vm_y + vm_h], outline=(148, 163, 184), width=1)

    path = os.path.join(img_dir, "thumbnail.png")
    img.save(path, "PNG")
    print(f"[+] Salvato {path}")

# 2. Genera thumbnail-dark.png (Tema Scuro 400x300)
def generate_thumbnail_dark():
    w, h = 400, 300
    img = Image.new("RGBA", (w, h), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)

    cols = 7
    rows = 6
    margin_x = 40
    margin_y = 35
    cell_w = (w - margin_x * 2) // cols
    cell_h = (h - margin_y * 2 - 40) // rows

    palette = [
        (30, 41, 59),     # dark cell
        (56, 189, 248),   # sky blue
        (14, 165, 233),   # blue
        (2, 132, 199),    # dark sky
        (125, 211, 252)   # bright
    ]

    pattern = [
        [0, 0, 1, 3, 1, 0, 0],
        [0, 1, 2, 4, 2, 0, 0],
        [1, 2, 3, 4, 3, 1, 0],
        [1, 1, 2, 3, 2, 0, 0],
        [0, 1, 1, 2, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
    ]

    for r in range(rows):
        for c in range(cols):
            x0 = margin_x + c * cell_w
            y0 = margin_y + r * cell_h
            x1 = x0 + cell_w - 3
            y1 = y0 + cell_h - 3
            intensity = pattern[r][c]
            color = palette[intensity]
            draw.rounded_rectangle([x0, y0, x1, y1], radius=4, fill=color)

    vm_y = h - 35
    vm_w = 180
    vm_h = 10
    vm_x = (w - vm_w) // 2
    for i in range(vm_w):
        factor = i / vm_w
        pal_idx = int(factor * (len(palette) - 1))
        draw.line([(vm_x + i, vm_y), (vm_x + i, vm_y + vm_h)], fill=palette[pal_idx])
    draw.rectangle([vm_x, vm_y, vm_x + vm_w, vm_y + vm_h], outline=(71, 85, 105), width=1)

    path = os.path.join(img_dir, "thumbnail-dark.png")
    img.save(path, "PNG")
    print(f"[+] Salvato {path}")

# 3. Genera example.png (800x500 con titolo, assi e tooltip)
def generate_example():
    w, h = 800, 500
    img = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Intestazione mockup
    draw.text((40, 20), "StratumHeatmap — Prenotazioni per Ora e Giorno", fill=(30, 41, 59))

    cols = 7
    rows = 12
    margin_x = 90
    margin_y = 60
    cell_w = (w - margin_x - 50) // cols
    cell_h = (h - margin_y - 80) // rows

    palette = [
        (238, 244, 249),
        (188, 213, 234),
        (122, 168, 207),
        (58, 106, 155),
        (28, 61, 94)
    ]

    days = ["1 - Lun", "2 - Mar", "3 - Mer", "4 - Gio", "5 - Ven", "6 - Sab", "7 - Dom"]
    hours = [f"{h:02d}:00" for h in range(7, 19)]

    for c, dname in enumerate(days):
        draw.text((margin_x + c * cell_w + 10, margin_y - 20), dname, fill=(71, 85, 105))

    for r, hname in enumerate(hours):
        draw.text((margin_x - 55, margin_y + r * cell_h + 6), hname, fill=(71, 85, 105))

    import random
    random.seed(42)

    for r in range(rows):
        for c in range(cols):
            x0 = margin_x + c * cell_w
            y0 = margin_y + r * cell_h
            x1 = x0 + cell_w - 4
            y1 = y0 + cell_h - 4
            
            # Giovedi ore 07-09 picco
            if c == 3 and 0 <= r <= 2:
                intensity = 4
                val = random.randint(300, 750)
            elif c < 5 and 1 <= r <= 6:
                intensity = random.randint(1, 3)
                val = random.randint(20, 150)
            else:
                intensity = random.randint(0, 1)
                val = random.randint(0, 20)

            color = palette[intensity]
            draw.rounded_rectangle([x0, y0, x1, y1], radius=4, fill=color)

            if val > 0:
                txt_color = (255, 255, 255) if intensity >= 3 else (28, 61, 94)
                draw.text((x0 + cell_w // 2 - 10, y0 + cell_h // 2 - 6), str(val), fill=txt_color)

    # Tooltip mockup evidenziato
    tx0 = margin_x + 3 * cell_w + cell_w // 2
    ty0 = margin_y + 1 * cell_h - 60
    draw.rectangle([tx0, ty0, tx0 + 170, ty0 + 75], fill=(15, 23, 42), outline=(51, 65, 85), width=1)
    draw.text((tx0 + 10, ty0 + 8), "4 - Gio × 08:00", fill=(255, 255, 255))
    draw.text((tx0 + 10, ty0 + 26), "Volume: 565", fill=(56, 189, 248))
    draw.text((tx0 + 10, ty0 + 44), "% su fascia: 82.4%", fill=(203, 213, 225))
    draw.text((tx0 + 10, ty0 + 58), "% su giorno: 27.8%", fill=(203, 213, 225))

    path = os.path.join(img_dir, "example.png")
    img.save(path, "PNG")
    print(f"[+] Salvato {path}")

if __name__ == "__main__":
    generate_thumbnail_light()
    generate_thumbnail_dark()
    generate_example()
