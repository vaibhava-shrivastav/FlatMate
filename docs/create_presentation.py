import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Brand Colors
    C_BG_DARK = RGBColor(15, 23, 42)       # Slate 900
    C_CARD_DARK = RGBColor(30, 41, 59)     # Slate 800
    C_CARD_BORDER = RGBColor(51, 65, 85)   # Slate 700
    C_PRIMARY = RGBColor(99, 102, 241)     # Indigo 500
    C_PRIMARY_LIGHT = RGBColor(165, 180, 252) # Indigo 300
    C_SUCCESS = RGBColor(16, 185, 129)     # Emerald 500
    C_AMBER = RGBColor(245, 158, 11)       # Amber 500
    C_TEXT_LIGHT = RGBColor(248, 250, 252) # Slate 50
    C_TEXT_MUTED = RGBColor(148, 163, 184) # Slate 400

    def add_header(slide, title_text, category="FLATMATE PROJECT PRESENTATION"):
        # Category pill/label
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(0.4))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = tf_cat.margin_top = tf_cat.margin_right = tf_cat.margin_bottom = 0
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = C_PRIMARY

        # Main Slide Title
        t_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.7), Inches(0.7))
        tf_t = t_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.size = Pt(24)
        p_t.font.bold = True
        p_t.font.color.rgb = C_TEXT_LIGHT

    def add_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_BG_DARK
        bg.line.fill.background()
        return bg

    def add_card(slide, left, top, width, height, bg_color=C_CARD_DARK, border_color=C_CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        return card

    # ==========================================
    # SLIDE 1: Title Slide
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    add_bg(s1)

    # Accent decorative banner
    accent = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(0.15), Inches(4.2))
    accent.fill.solid()
    accent.fill.fore_color.rgb = C_PRIMARY
    accent.line.fill.background()

    tb = s1.shapes.add_textbox(Inches(1.2), Inches(1.4), Inches(11.0), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "FINAL YEAR / CAPSTONE PROJECT DEFENSE"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = C_PRIMARY_LIGHT
    p0.space_after = Pt(14)

    p1 = tf.add_paragraph()
    p1.text = "FlatMate: AI-Driven Flat &\nRoommate Matching Platform"
    p1.font.size = Pt(40)
    p1.font.bold = True
    p1.font.color.rgb = C_TEXT_LIGHT
    p1.space_after = Pt(16)

    p2 = tf.add_paragraph()
    p2.text = "Eliminating Shared Accommodation Friction Through Geospatial Discovery, Semantic AI Harmony, and Real-Time WebSockets."
    p2.font.size = Pt(16)
    p2.font.color.rgb = C_TEXT_MUTED
    p2.space_after = Pt(28)

    p3 = tf.add_paragraph()
    p3.text = "Tech Stack: React 18 · Node.js · Express · MongoDB Atlas · Socket.IO · Google Gemini 2.0 Flash · Cloudinary"
    p3.font.size = Pt(13)
    p3.font.bold = True
    p3.font.color.rgb = C_SUCCESS

    # ==========================================
    # SLIDE 2: The Problem
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_bg(s2)
    add_header(s2, "The Problem: The Cost of Roommate Friction", "Problem Statement")

    col_w = Inches(3.6)
    gap = Inches(0.4)
    top_y = Inches(1.8)
    h = Inches(4.8)

    cards_data_s2 = [
        ("01. Lifestyle Incompatibility", 
         "Night Owls vs. Early Birds", 
         "Over 70% of roommate conflicts in university hubs stem from everyday routine clashes: disparate sleep schedules, cleanliness standards in shared bathrooms, and cooking habits that cannot be captured by basic flat listings.",
         C_PRIMARY),
        ("02. Geospatial Blindspots", 
         "Inaccurate Transit Estimates", 
         "Students frequently sign leases based on vague address descriptions, discovering too late that daily commutes to campuses (like Galgotias, Sharda, GL Bajaj) take 45+ minutes rather than walking distance.",
         C_AMBER),
        ("03. Communication Lag & Ghosting", 
         "Unverified & Fragmented Chats", 
         "Relying on fragmented WhatsApp groups and classifieds leads to unresponsive hosts, spam, zero verification, and complete lack of trust before financial security deposits are exchanged.",
         C_SUCCESS)
    ]

    for i, (num, sub, desc, color) in enumerate(cards_data_s2):
        left_x = Inches(0.8) + i * (col_w + gap)
        add_card(s2, left_x, top_y, col_w, h)
        
        tb = s2.shapes.add_textbox(left_x + Inches(0.3), top_y + Inches(0.4), col_w - Inches(0.6), h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = num
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(8)

        p_sub = tf.add_paragraph()
        p_sub.text = sub
        p_sub.font.size = Pt(17)
        p_sub.font.bold = True
        p_sub.font.color.rgb = C_TEXT_LIGHT
        p_sub.space_after = Pt(14)

        p_desc = tf.add_paragraph()
        p_desc.text = desc
        p_desc.font.size = Pt(13)
        p_desc.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 3: The Solution
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_bg(s3)
    add_header(s3, "The FlatMate Solution: A Two-Sided Living Ecosystem", "Proposed Solution")

    sol_cards = [
        ("Interactive Geospatial Discovery", 
         "High-density grid view synchronized with an interactive Leaflet map. Students filter by budget, room type (private, shared, studio), and Greater Noida sectors with instant visual pins."),
        ("Multi-Dimensional Habit Profiling", 
         "Structured onboarding captures a 6-factor lifestyle vector: sleep rhythm, cleanliness, smoking, cooking frequency, guest tolerance, and noise sensitivity."),
        ("Semantic AI Harmony (Gemini 2.0)", 
         "Google Gemini 2.0 Flash synthesizes complex lifestyle preferences into a single percentage match score, an AI Vibe Summary, and clear pros & considerations."),
        ("Event-Driven Real-Time Chat", 
         "Low-latency Socket.IO peer-to-peer messaging with live typing bubbles, ensuring instantaneous communication between verified room hosts and seekers.")
    ]

    card_w = Inches(5.6)
    card_h = Inches(2.2)
    for i, (title, body) in enumerate(sol_cards):
        col = i % 2
        row = i // 2
        lx = Inches(0.8) + col * (card_w + Inches(0.5))
        ty = Inches(1.8) + row * (card_h + Inches(0.4))
        add_card(s3, lx, ty, card_w, card_h)

        tb = s3.shapes.add_textbox(lx + Inches(0.3), ty + Inches(0.3), card_w - Inches(0.6), card_h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = C_PRIMARY_LIGHT
        p.space_after = Pt(8)

        p2 = tf.add_paragraph()
        p2.text = body
        p2.font.size = Pt(12.5)
        p2.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 4: System Architecture
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_bg(s4)
    add_header(s4, "Full-Stack System Architecture & Pipeline", "Technical Architecture")

    arch_layers = [
        ("Presentation Layer (Client)", "React 18 · Vite · Tailwind CSS · Leaflet", 
         "• Single Page Application (SPA) architecture\n• Reactive Leaflet maps with custom coordinate pins\n• Real-time Socket.IO client event synchronization\n• Mobile-first responsive UI with zero-mock data pipelines", C_PRIMARY),
        ("Application Layer (Server)", "Node.js · Express · Socket.IO Server", 
         "• REST API handling auth, listings, and user profiles\n• Authenticated WebSocket gateway verifying JWT on handshake\n• Multer multipart streaming to Cloudinary cloud bucket\n• CORS management for local and production deployments", C_SUCCESS),
        ("AI & Intelligence Tier", "Google Gemini 2.0 Flash · Heuristic Engine", 
         "• Semantic prompt engineering returning strict JSON structures\n• 6-second timeout race condition with automated fallback\n• Euclidean habit vector difference score calculation\n• Permanent Match document caching in MongoDB", C_AMBER),
        ("Persistence Layer (Database)", "MongoDB Atlas · 2dsphere Indexing", 
         "• User collection storing encrypted auth & habit vectors\n• Listing collection indexed with GeoJSON Point coordinates\n• Message collection for persistent real-time chat histories\n• Match cache collection preventing redundant AI calls", C_PRIMARY_LIGHT)
    ]

    col_w_4 = Inches(2.7)
    gap_4 = Inches(0.3)
    for i, (layer_title, sub, details, col) in enumerate(arch_layers):
        lx = Inches(0.8) + i * (col_w_4 + gap_4)
        add_card(s4, lx, Inches(1.8), col_w_4, Inches(4.8))

        tb = s4.shapes.add_textbox(lx + Inches(0.2), Inches(2.0), col_w_4 - Inches(0.4), Inches(4.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = layer_title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = col
        p.space_after = Pt(4)

        psub = tf.add_paragraph()
        psub.text = sub
        psub.font.size = Pt(11)
        psub.font.bold = True
        psub.font.color.rgb = C_TEXT_LIGHT
        psub.space_after = Pt(12)

        pdet = tf.add_paragraph()
        pdet.text = details
        pdet.font.size = Pt(11.5)
        pdet.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 5: AI Compatibility Engine
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_bg(s5)
    add_header(s5, "AI Roommate Matchmaking: Gemini 2.0 Flash", "Artificial Intelligence")

    # Left card: Vector Inputs
    add_card(s5, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tb_l = s5.shapes.add_textbox(Inches(1.1), Inches(2.1), Inches(5.0), Inches(4.2))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    p = tf_l.paragraphs[0]
    p.text = "1. The 6-Dimensional Habit Vector"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_PRIMARY_LIGHT
    p.space_after = Pt(12)

    p_v = tf_l.add_paragraph()
    p_v.text = (
        "During onboarding, each user quantifies their living style (1–10):\n\n"
        "• Sleep Schedule: Night Owl (1) ↔ Early Riser (10)\n"
        "• Cleanliness: Casual (1) ↔ Meticulous / Daily Sanitized (10)\n"
        "• Smoking / Alcohol: Strictly Prohibited (1) ↔ Casual (10)\n"
        "• Cooking Frequency: Never / Tiffin (1) ↔ Daily Home Chef (10)\n"
        "• Guest Policy: Strict Study Hours (1) ↔ Frequent Weekend Visitors (10)\n"
        "• Noise Tolerance: Absolute Silence (1) ↔ Lively / Music (10)\n\n"
        "These vectors feed into candidate selection filtered by role (HAS_ROOM vs. SEARCHING_ROOM) and 25km proximity."
    )
    p_v.font.size = Pt(12.5)
    p_v.font.color.rgb = C_TEXT_MUTED

    # Right card: Gemini Output
    add_card(s5, Inches(6.9), Inches(1.8), Inches(5.6), Inches(4.8))
    tb_r = s5.shapes.add_textbox(Inches(7.2), Inches(2.1), Inches(5.0), Inches(4.2))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    p = tf_r.paragraphs[0]
    p.text = "2. Qualitative Semantic Synthesis"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_SUCCESS
    p.space_after = Pt(12)

    p_out = tf_r.add_paragraph()
    p_out.text = (
        "Gemini 2.0 Flash is prompted with a strict JSON system prompt:\n\n"
        '{\n'
        '  "compatibilityScore": 94,\n'
        '  "vibeSummary": "Strong lifestyle alignment. Both Kartik and Priya prioritize quiet study hours after 10 PM and keep shared spaces spotless.",\n'
        '  "pros": [\n'
        '    "Aligned sleep schedules (11 PM - 7 AM)",\n'
        '    "Mutual non-smoking preferences",\n'
        '    "High hygiene standards in kitchen/bath"\n'
        '  ],\n'
        '  "cons": ["Shared kitchen during morning exam rush"]\n'
        '}\n\n'
        "Cached in the database so each pair is only evaluated once!"
    )
    p_out.font.size = Pt(11.5)
    p_out.font.color.rgb = C_TEXT_LIGHT

    # ==========================================
    # SLIDE 6: Fault Tolerance & Fallback
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_bg(s6)
    add_header(s6, "Zero-Downtime Resilience: The Heuristic Fallback", "System Reliability")

    add_card(s6, Inches(0.8), Inches(1.8), Inches(11.7), Inches(4.8))
    tb_6 = s6.shapes.add_textbox(Inches(1.2), Inches(2.1), Inches(11.0), Inches(4.2))
    tf_6 = tb_6.text_frame
    tf_6.word_wrap = True

    p = tf_6.paragraphs[0]
    p.text = "Why Fallback Engineering Matters for Real-World Deployments"
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = C_AMBER
    p.space_after = Pt(10)

    p_desc = tf_6.add_paragraph()
    p_desc.text = (
        "External AI APIs can introduce latency spikes, encounter rate limits, or suffer network dropouts. "
        "FlatMate guarantees uninterrupted user experience through an automated two-layer fallback architecture:"
    )
    p_desc.font.size = Pt(13)
    p_desc.font.color.rgb = C_TEXT_MUTED
    p_desc.space_after = Pt(16)

    p_f1 = tf_6.add_paragraph()
    p_f1.text = "1. Strict 6-Second Timeout Guard:"
    p_f1.font.size = Pt(14)
    p_f1.font.bold = True
    p_f1.font.color.rgb = C_TEXT_LIGHT
    p_f1_b = tf_6.add_paragraph()
    p_f1_b.text = "The AI call is executed inside Promise.race() against a 6000ms timer. If Gemini takes longer than 6 seconds, the request is immediately aborted before the user notices lag."
    p_f1_b.font.size = Pt(12.5)
    p_f1_b.font.color.rgb = C_TEXT_MUTED
    p_f1_b.space_after = Pt(12)

    p_f2 = tf_6.add_paragraph()
    p_f2.text = "2. Mathematical Euclidean Difference Algorithm:"
    p_f2.font.size = Pt(14)
    p_f2.font.bold = True
    p_f2.font.color.rgb = C_TEXT_LIGHT
    p_f2_b = tf_6.add_paragraph()
    p_f2_b.text = "When triggered, our internal algorithm computes the normalized Euclidean distance across all habit vector dimensions: Score = round(100 - (diffSum / maxDiff) * 100). The UI transparently indicates 'Heuristic Engine', guaranteeing zero broken pages or 500 errors."
    p_f2_b.font.size = Pt(12.5)
    p_f2_b.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 7: Real-Time WebSockets
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_bg(s7)
    add_header(s7, "Real-Time Event-Driven Chat Architecture", "Communication Engine")

    cards_s7 = [
        ("JWT Handshake Security", 
         "Connection-Level Auth", 
         "Every WebSocket handshake passes the JWT bearer token via socket.handshake.auth.token. Sockets are authenticated in io.use() middleware, binding socket.userId before connection is granted.",
         C_PRIMARY),
        ("Room-Isolated Messaging", 
         "Targeted Broadcasting", 
         "Users join specific rooms via socket.emit('joinChat', chatId). Messages are broadcast strictly to participants: io.to(chatId).emit('receiveMessage'). Server validates senderId === socket.userId to prevent spoofing.",
         C_SUCCESS),
        ("Typing Synchronization", 
         "Live User Presence", 
         "Client emits user_typing with flexible payload handling (string or object). Server relays event via socket.to(chatId).emit('user_typing'), providing a responsive messaging experience with automatic 3s timeout.",
         C_AMBER)
    ]

    for i, (title, sub, body, color) in enumerate(cards_s7):
        lx = Inches(0.8) + i * (col_w + gap)
        add_card(s7, lx, top_y, col_w, h)
        tb = s7.shapes.add_textbox(lx + Inches(0.3), top_y + Inches(0.4), col_w - Inches(0.6), h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(6)

        psub = tf.add_paragraph()
        psub.text = sub
        psub.font.size = Pt(16)
        psub.font.bold = True
        psub.font.color.rgb = C_TEXT_LIGHT
        psub.space_after = Pt(12)

        pdesc = tf.add_paragraph()
        pdesc.text = body
        pdesc.font.size = Pt(12.5)
        pdesc.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 8: Cloud Media Pipeline
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    add_bg(s8)
    add_header(s8, "Cloud-Native Media Storage: Multer & Cloudinary", "Media Infrastructure")

    steps_s8 = [
        ("Step 1: Multi-Photo Client Selection", 
         "Host selects up to 5 property photos. Client constructs a standard multipart/form-data payload with listing attributes (rent, location coordinates, amenities)."),
        ("Step 2: Multer Cloudinary Stream Pipeline", 
         "Express route mounts upload.array('images', 5). Multer streams incoming binary buffers directly to Cloudinary's secure CDN bucket without saving temporary files to local disk."),
        ("Step 3: Multipart JSON Normalization", 
         "Backend listing controller parses stringified JSON fields (location and amenities) ensuring strict GeoJSON compliance with fallback coordinates for Greater Noida."),
        ("Step 4: CDN Delivery & Fast Caching", 
         "Cloudinary returns optimized HTTPS URLs (https://res.cloudinary.com/...) stored directly in the Listing.images array for lightning-fast worldwide delivery.")
    ]

    step_h = Inches(1.05)
    for i, (stitle, sdesc) in enumerate(steps_s8):
        ty = Inches(1.8) + i * (step_h + Inches(0.18))
        add_card(s8, Inches(0.8), ty, Inches(11.7), step_h)

        tb = s8.shapes.add_textbox(Inches(1.1), ty + Inches(0.15), Inches(11.1), step_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = C_PRIMARY_LIGHT
        p.space_after = Pt(3)

        p2 = tf.add_paragraph()
        p2.text = sdesc
        p2.font.size = Pt(12)
        p2.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 9: Database Schema
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_bg(s9)
    add_header(s9, "Database Schema & Geospatial Indexing", "Database Engineering")

    schema_cards = [
        ("User Schema", "Identity & Habit Vectors", 
         "• name, email, password (bcrypt)\n• role: 'HAS_ROOM' | 'SEARCHING_ROOM'\n• habitVector: { sleep, clean, smoke, cook, guests, noise }\n• location: GeoJSON Point [lng, lat]\n• 2dsphere index enabled"),
        ("Listing Schema", "Room Inventory & Media", 
         "• title, rent, roomType, amenities\n• images: [ Cloudinary CDN URLs ]\n• location: GeoJSON Point [lng, lat]\n• owner: ObjectId ref 'User'\n• 2dsphere index for $near search"),
        ("Match Schema", "AI Evaluation Cache", 
         "• userA, userB (sorted ObjectIds)\n• compatibilityScore: Number (0-100)\n• pros: [ String ], cons: [ String ]\n• vibeSummary: String\n• isFallback: Boolean\n• Indexed by [userA, userB]"),
        ("Message Schema", "Real-Time Chat History", 
         "• chatId: Indexed room string\n• senderId: ObjectId ref 'User'\n• participants: [ ObjectId ]\n• text: String (trimmed)\n• timestamps: createdAt, updatedAt")
    ]

    for i, (title, sub, body, color) in enumerate([
        (schema_cards[0][0], schema_cards[0][1], schema_cards[0][2], C_PRIMARY),
        (schema_cards[1][0], schema_cards[1][1], schema_cards[1][2], C_SUCCESS),
        (schema_cards[2][0], schema_cards[2][1], schema_cards[2][2], C_AMBER),
        (schema_cards[3][0], schema_cards[3][1], schema_cards[3][2], C_PRIMARY_LIGHT),
    ]):
        lx = Inches(0.8) + i * (col_w_4 + gap_4)
        add_card(s9, lx, Inches(1.8), col_w_4, Inches(4.8))

        tb = s9.shapes.add_textbox(lx + Inches(0.2), Inches(2.0), col_w_4 - Inches(0.4), Inches(4.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(4)

        psub = tf.add_paragraph()
        psub.text = sub
        psub.font.size = Pt(11)
        psub.font.bold = True
        psub.font.color.rgb = C_TEXT_LIGHT
        psub.space_after = Pt(12)

        pdet = tf.add_paragraph()
        pdet.text = body
        pdet.font.size = Pt(11.5)
        pdet.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 10: Security & Performance
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    add_bg(s10)
    add_header(s10, "Security & Performance Engineering", "Production Readiness")

    sec_cards = [
        ("Authentication & Passwords", "Stateless Security", 
         "• Bcrypt password hashing with 10 salt rounds.\n• Stateless JSON Web Tokens (JWT) with standard expiration.\n• Strict authMiddleware safeguarding protected REST routes.\n• Dedicated logout endpoint ensuring clean client-side teardown."),
        ("WebSocket Integrity", "Real-Time Protection", 
         "• Token verification on Socket.IO connection handshake.\n• Server enforces senderId === socket.userId on every message.\n• Room-level isolation preventing cross-chat eavesdropping.\n• CORS origin whitelisting allowing only authorized web clients."),
        ("Performance & Caching", "Sub-Second Latency", 
         "• Caching of Gemini compatibility results in Match documents.\n• MongoDB 2dsphere indexes avoiding in-memory distance loops.\n• Single-bundle Vite packaging with tree-shaking.\n• Zero unnecessary network refetches on conversation transitions.")
    ]

    for i, (title, sub, body) in enumerate(sec_cards):
        lx = Inches(0.8) + i * (col_w + gap)
        add_card(s10, lx, top_y, col_w, h)
        tb = s10.shapes.add_textbox(lx + Inches(0.3), top_y + Inches(0.4), col_w - Inches(0.6), h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = C_PRIMARY_LIGHT
        p.space_after = Pt(6)

        psub = tf.add_paragraph()
        psub.text = sub
        psub.font.size = Pt(16)
        psub.font.bold = True
        psub.font.color.rgb = C_TEXT_LIGHT
        psub.space_after = Pt(12)

        pdesc = tf.add_paragraph()
        pdesc.text = body
        pdesc.font.size = Pt(12.5)
        pdesc.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 11: Live Demo Walkthrough
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    add_bg(s11)
    add_header(s11, "Split-Screen Live Demonstration Walkthrough", "Live Demonstration")

    demo_steps = [
        ("Phase 1: Geospatial Discovery", 
         "Seeker Priya explores student listings in Knowledge Park on the interactive Leaflet map. Filters for private rooms under ₹10,000/mo."),
        ("Phase 2: Gemini Compatibility", 
         "Priya clicks Kartik's room -> Opens AI Compatibility Analysis. Gemini displays 94% match, Vibe Summary, and quiet study alignment."),
        ("Phase 3: One-Click Instant Messaging", 
         "Priya clicks 'Message Host'. Chat window opens directly with Kartik's profile header, sending an inquiry in real time."),
        ("Phase 4: Bidirectional Live Sockets", 
         "Kartik's screen immediately renders Priya's message. When Kartik replies, Priya sees live typing bubbles before the message arrives.")
    ]

    for i, (stitle, sdesc) in enumerate(demo_steps):
        ty = Inches(1.8) + i * (step_h + Inches(0.18))
        add_card(s11, Inches(0.8), ty, Inches(11.7), step_h)

        tb = s11.shapes.add_textbox(Inches(1.1), ty + Inches(0.15), Inches(11.1), step_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = C_SUCCESS
        p.space_after = Pt(3)

        p2 = tf.add_paragraph()
        p2.text = sdesc
        p2.font.size = Pt(12)
        p2.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 12: Future Roadmap
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    add_bg(s12)
    add_header(s12, "Future Roadmap & Commercial Opportunities", "Next Steps")

    road_cards = [
        ("AI Lease Agreement Analyzer", 
         "Use Gemini Vision to upload PDF rental agreements and flag hidden maintenance fees, illegal lock-in clauses, or excessive security deposit terms."),
        ("Split-Expense Ledger", 
         "In-chat ledger allowing roommates to track shared utilities (Wi-Fi, electricity, gas cylinders, groceries) with integrated UPI payment settlement."),
        ("Institutional Verification", 
         "Verify student and faculty badges using college domains (.ac.in / .edu) to build trusted gated micro-communities for university clusters."),
        ("Cross-Platform Mobile Apps", 
         "Package the client with React Native / Capacitor to deliver push notifications for incoming chat messages and new matching flatmate alerts.")
    ]

    for i, (title, body) in enumerate(road_cards):
        col = i % 2
        row = i // 2
        lx = Inches(0.8) + col * (card_w + Inches(0.5))
        ty = Inches(1.8) + row * (card_h + Inches(0.4))
        add_card(s12, lx, ty, card_w, card_h)

        tb = s12.shapes.add_textbox(lx + Inches(0.3), ty + Inches(0.3), card_w - Inches(0.6), card_h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = C_PRIMARY_LIGHT
        p.space_after = Pt(8)

        p2 = tf.add_paragraph()
        p2.text = body
        p2.font.size = Pt(12.5)
        p2.font.color.rgb = C_TEXT_MUTED

    # ==========================================
    # SLIDE 13: Conclusion & Q&A
    # ==========================================
    s13 = prs.slides.add_slide(blank_layout)
    add_bg(s13)

    tb_end = s13.shapes.add_textbox(Inches(1.2), Inches(1.8), Inches(11.0), Inches(4.5))
    tf_end = tb_end.text_frame
    tf_end.word_wrap = True

    p0 = tf_end.paragraphs[0]
    p0.text = "CONCLUSION & DEFENSE"
    p0.font.size = Pt(14)
    p0.font.bold = True
    p0.font.color.rgb = C_PRIMARY
    p0.space_after = Pt(16)

    p1 = tf_end.add_paragraph()
    p1.text = "FlatMate: Living in Harmony Starts with Data"
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = C_TEXT_LIGHT
    p1.space_after = Pt(20)

    p2 = tf_end.add_paragraph()
    p2.text = (
        "• Solved a high-friction personal pain point for relocating students & young professionals.\n"
        "• Integrated cutting-edge AI (Gemini 2.0 Flash) with zero-downtime mathematical fallbacks.\n"
        "• Delivered real-time event-driven WebSockets and cloud media streaming.\n"
        "• Built with production scalability, security, and responsive UX across all layers."
    )
    p2.font.size = Pt(14)
    p2.font.color.rgb = C_TEXT_MUTED
    p2.space_after = Pt(32)

    p3 = tf_end.add_paragraph()
    p3.text = "Thank You! We are open for Questions & Feedback."
    p3.font.size = Pt(18)
    p3.font.bold = True
    p3.font.color.rgb = C_SUCCESS

    output_path = os.path.abspath(os.path.join("docs", "FlatMate_Final_Presentation.pptx"))
    prs.save(output_path)
    print(f"Presentation successfully saved to: {output_path}")

if __name__ == "__main__":
    create_deck()
