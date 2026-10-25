# Antigravity Handoff — ดาวลูกหมู-001

อัปเดต: 25 ตุลาคม 2026  
โปรเจกต์: เซอร์ไพรส์วันเกิดข้าวหอม ธีมเดินทางในกาแล็กซี 3D

## เป้าหมาย

ทำเว็บเซอร์ไพรส์วันเกิดให้ภาพคม อ่านง่าย และลื่นขึ้น โดยเริ่มจากข้อความแฮปปี้เบิร์ดเดย์ แล้วพาผู้ชมเดินทางเข้าไปยังดาว **ดาวลูกหมู-001** มีระบบดาว/หัวใจ/ความทรงจำ/คำอวยพร และเอฟเฟกต์พลุดาวแตกที่พอดี โทนหลักม่วงตามความชอบของข้าวหอม

ไฟล์แผนต้นฉบับอยู่ที่ [แผนใหม่.md](./แผนใหม่.md) ให้อ่านเป็นสเปกและแนวทางงาน ส่วนคำขอที่ผู้ใช้ยืนยันคือให้ทำตามแผนและเก็บไฟล์ไว้ในโฟลเดอร์โปรเจกต์แล้ว

## สถานะโปรเจกต์

- สาขางานล่าสุด: `upgrade/cinematic-galaxy` (ตรวจ remote/status ก่อนเริ่มรับช่วง)
- แผนถูกคัดลอกเข้าโปรเจกต์เป็น `แผนใหม่.md`
- เพิ่มสคริปต์ `npm run visual:qa` และภาพตรวจ 3 ขนาดไว้ใน `qa/p0` ถึง `qa/p3`
- เพิ่มระบบตั้งค่าคุณภาพ/ปรับตามประสิทธิภาพใน `src/core/quality.js`, กล้องตามสัดส่วนจอใน `src/core/responsive.js`, นาฬิกาวงโคจรใน `src/core/orbitClock.js`
- เพิ่ม procedural wormhole ที่ `src/scene/wormhole.js`
- ปรับ renderer, bloom, OutputPass, MSAA, resize/camera, การพักวาดภาพเมื่อแท็บซ่อน และการกู้คืน WebGL ใน `src/main.js`
- ปรับดาว/กาแล็กซี/วงโคจร/ดาวเคราะห์ใน `src/scene/galaxySkybox.js`, `src/scene/spiralGalaxy.js`, `src/scene/solarSystemHeart.js`
- เพิ่มโหมด `?debug=1`, `?quality=...`, `?cinema=1`, `?mute=1`, `?skipintro=1`, `?ratio=9x16`
- แยกไฟล์ฉากเก่าที่ไม่ได้ import ไปไว้ใน `legacy/scene/`
- เพิ่ม `ASSETS_TODO.md`, `CREDITS.md`; ลดการ preload เพลงจนกว่าผู้ใช้จะเริ่มเล่น
- ติดตั้งเครื่องมือ QA ใน devDependencies: Playwright, pngjs, lil-gui, stats.js
- ปรับกล้องให้คำนวณขอบเขตวงโคจรจาก perspective projection จริง และตั้งมุม portrait ให้เห็นวงโคจรชัดขึ้น
- ปรับ HUD สำหรับอัตราส่วนแนวตั้ง, ปรับ pointer raycast ตามขอบ canvas, ลดสี/เงาปุ่มอวยพรให้คุมแสงฟุ้ง
- เปลี่ยนวงโคจรจาก `THREE.Line` เป็น tube mesh บางที่มีความกว้างจริงบน WebGL
- เพิ่ม texture ดาวจริงของ Solar System Scope (CC BY 4.0) ใน `public/textures/planets/`; โหลดแบบ async และเก็บ procedural fallback ไว้
- เพิ่ม Earth cloud layer, bump map fallback, Saturn ring alpha/รายละเอียด และขยายชื่อ 3D สีแดงใน galaxy view
- ปรับ nebula sprite ให้จางลงและใช้ procedural alpha noise เพื่อลดทรงวงกลมฟุ้ง
- `npm run build` ผ่าน และ `npm run visual:qa -- --phase=cinematic-ready` ผ่านโดยไม่มี console/page errors; ภาพอยู่ใน `qa/cinematic-ready/`

## จุดที่ต้องทำต่อก่อนส่งงาน

1. ทดสอบ performance บน GPU จริงทั้ง desktop และมือถือ; FPS จาก SwiftShader ใน Playwright ใช้ benchmark ไม่ได้
2. ตรวจชื่อ “ข้าวหอม” และภาพดาวบน browser จริงเพิ่มเติม; ชื่อยังเป็น texture-plane หลายชั้น ไม่ใช่ SVG extrusion จริง
3. ต่อ P4–P8 ตาม [แผนใหม่.md](./แผนใหม่.md): ทำกาแล็กซีให้มี dust lane/มิติ, ปรับ director/arrival, เพิ่ม director recording ถ้าต้องการคลิปอัตโนมัติ
4. ตรวจ `npm audit` ที่เคยรายงานช่องโหว่ 2 รายการและหาทางแก้แบบไม่ใช้ `--force`
5. เปลี่ยนภาพ Unsplash placeholder ด้วยภาพที่เจ้าของเลือกก่อนเผยแพร่

## แนวทางภาพและ UX ที่ผู้ใช้ต้องการ

- ลดหมอก/แสงฟุ้งและ bloom ให้มีเฉพาะจุดเด่น ภาพต้องอ่านง่ายและขอบวัตถุคม
- ตอนเดินทางในกาแล็กซี ให้ชื่อ **ข้าวหอม** แบบ 3D สีแดงอยู่ด้านหลังเฉพาะโหมด “ท่องกาแล็กซี่ 3D” ตามที่ผู้ใช้เคยระบุ
- อย่าเปลี่ยนข้อความภาษาไทยเดิมใน UI หรือ `src/config/memoriesData.js` โดยไม่มีคำขอ
- เพลงที่ผู้ใช้เลือกไว้ถูกคัดลอกไว้ที่ `public/audio/velika-official-audio.mp3`; สิทธิ์เผยแพร่ยังต้องตรวจสอบ
- ผู้ใช้ต้องการเซอร์ไพรส์ที่ดูมีความตั้งใจ น่ารัก แต่ไม่รกหรือเอฟเฟกต์ฟุ้งเกินไป

## ไอเดียเสริมที่แนะนำ (ยังไม่ใช่สิ่งที่ต้องทำโดยอัตโนมัติ)

- ซ่อนข้อความลับบนดาวลูกหมู-001 ให้ค่อย ๆ เปิดเมื่อเดินทางเข้าใกล้
- เมื่อถึงดาว ให้ดาวเล็กเชื่อมเป็นรูปหัวใจหรืออักษร “ขห”
- ตอนกดคำอวยพร ให้ดาวแตกเป็นประกายสั้น ๆ แล้วจาง ไม่ปล่อยเอฟเฟกต์ค้าง
- เพิ่มเสียงติ๊งเบา ๆ พร้อมปุ่มปิดเสียงที่เข้าถึงง่าย
- เพิ่มปุ่มเก็บภาพ/ข้อความช่วงเวลานั้นไว้ส่งต่อ
- ทำ reduced-motion และลดจำนวนอนุภาคบนมือถือหรือเครื่องช้า

## คำสั่งที่ใช้

```bash
npm run dev
npm run build
npm run visual:qa -- --phase=handoff
```

ดู baseline ที่ `qa/plan-baseline/`, ภาพล่าสุดที่ `qa/cinematic-ready/` และชุดเดิมใน `qa/p0/` ถึง `qa/p3/`; ใช้ query flags ที่ระบุใน `src/core/quality.js` เปิดแต่ละโหมด

## หมายเหตุเรื่องขอบเขต

เอกสาร [แผนใหม่.md](./แผนใหม่.md) ครอบคลุมงานหลายเฟส P0–P9 และมีบางส่วนเป็นงานต่อยอด เช่น texture/โมเดลภายนอกที่ตรวจ license แล้ว, atmosphere/normal maps, เส้นทางกล้อง cinematic ที่ละเอียด, บันทึกวิดีโออัตโนมัติ และตรวจประสิทธิภาพบนอุปกรณ์จริง อย่าอ้างว่างานเหล่านี้เสร็จแล้วหากยังไม่ได้ทำและตรวจจริง ให้บันทึกสิ่งที่ทำเพิ่มและผล QA ในไฟล์นี้หรือ `UPGRADE_STATUS.md`

## อัปเดตตามแผนรอบ 25 ตุลาคม 2026

ทำรายการตามแผนต่อ โดยเว้นรูปจริงไว้ก่อน:

- A1: แก้ glow หลังชื่อให้ใช้ canvas 256×256 และขยาย sprite เป็นวงรี
- A2–A3: ล็อกชื่อไม่ให้ตัดบรรทัด; มือถือใช้ชื่อย่อ “ข้าวหอม” และแสดงหัวใจ 5 ดวงในแถวเดียว; แตะการ์ดชื่อเพื่อขยาย subtitle
- A4: แยก MSAA และ bloom ตาม quality tier, จำกัด pixel ratio มือถือที่ 1.5, ให้ tier ต่ำลดดาวผ่าน `setQuality` ที่มีอยู่และลด bloom
- A5: เพิ่มแถบ progress ใช้ `THREE.LoadingManager` กับ texture ดาวเคราะห์ และรอ texture ก่อนเปิด intro; ภาพความทรงจำยังเป็น placeholder ระยะไกลและยังไม่ได้ preload
- A6: ตั้ง Vite `base: './'` และเปลี่ยน texture/audio URLs ให้ใช้ `BASE_URL` เพื่อรองรับ subpath
- B1: เพิ่ม RoomEnvironment + PMREM environment map
- B2: เพิ่ม transmission/iridescence ให้หัวใจเฉพาะ tier high/ultra (tier ต่ำปิด); ค่าความหนาและ IOR ถูกตั้งไว้
- B3: เพิ่ม cinematic ShaderPass สำหรับ vignette, grain และ chromatic aberration บน high/ultra; reduced motion ปิด grain
- B4: เปิด BokehPass เฉพาะช่วงบิน/Director บน high/ultra และปิดบน tier ต่ำ/reduced-motion
- B5–B6: เพิ่ม Fresnel atmosphere โลก/ศุกร์, procedural city lights กลางคืนของโลก, เงาจางบนวงแหวนเสาร์, ป้ายชื่อดาวบน hover และลดความสว่างวงโคจรที่ยังไม่เปิด
- ปรับ visual QA ให้รอ loading overlay จบก่อนถ่ายภาพ

ตรวจแล้ว:

- `npm run build` ผ่านหลังเพิ่มฟีเจอร์
- `npm run visual:qa -- --phase=all-features-verified` จบโดยไม่มี browser/page/console errors
- QA desktop เปิดครบ 5 ความทรงจำ; ปุ่มเก็บภาพดาวน์โหลด PNG ที่ไม่ดำ (mean luminance 0.3752)
- ภาพ 4 มุมมองและ `birthday-smoke.png` อยู่ใน `qa/all-features-verified/`; SwiftShader ใช้ดูภาพ/ข้อผิดพลาดเท่านั้น ไม่ใช้ยืนยัน FPS จริง

ยังต้องทำก่อนเผยแพร่:

- H: รอรูปจริง 5 รูปตามที่เจ้าของจะส่งภายหลัง; `memoriesData.js` และ placeholder เดิมยังไม่ถูกแก้
- ลองฟัง analyzer/typewriter sound บนอุปกรณ์จริง; ทดสอบมือถือจริง 2 รุ่น, LINE/Instagram, reduced-motion และ WebGL context restore
- Deploy production บน Vercel แล้ว: https://birthday-pi-wheat.vercel.app; ตรวจ `/`, SVG, texture เสาร์ และเพลง ได้ HTTP 200
- มือถือจริง/LINE/Instagram ยังรอทดสอบก่อนยืนยันความพร้อมสมบูรณ์
- ภาษาไทยใน SVG สร้างจาก Prompt Regular และแสดงผลในภาพ QA แล้ว; ตรวจรายละเอียดตำแหน่งสระบนอุปกรณ์จริงได้อีกครั้ง
- ไม่ได้อ้างว่า FPS ผ่านจากผล SwiftShader
