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

## อัปเดตแผนรอบ 2 — 25 ตุลาคม 2026

ทำและตรวจในรอบนี้:

- R0.1: แก้แกน Y ของ SVG ชื่อให้ตั้งตรง ลด bevel จาก 8.5 เป็น 4 และซ่อน plane fallback หลัง SVG โหลด เพื่อไม่ให้ชื่อซ้อนสองชั้น
- R0.2: เพิ่ม radial sprite ให้ bulge และจัดให้อยู่หลังระบบดาว; ลดจำนวนจุด bulge ให้เห็นเป็นกลุ่มดาวแทนก้อนแน่น
- R0.3: เพิ่ม opacity วงโคจรที่ยังไม่เปิดเป็น 0.13; visited 0.28 และ hover 0.42 คงเดิม
- R0.4: อัปเกรด Vite เป็น 6.4.5 (ไม่ใช้ `audit fix --force`), audit พบ 0 vulnerabilities; preload เฉพาะ memory image ที่เป็น local origin โดยไม่เปลี่ยน placeholder URL
- W1: อนุภาค arrival ใช้จำนวนตาม tier, รวมเป็นหัวใจ เปลี่ยนเป็น “ขห” แล้วสลาย; มี `?fx=off`, reduced-motion ลดจำนวนและระยะเอฟเฟกต์
- W2: เพิ่มเส้นจากดาวที่เปิดไปหัวใจกลาง และเส้นหัวใจครอบระบบเมื่อครบ 5 ดวง; จำนวนจุดลดตาม tier และปิดได้ด้วย `?fx=off`
- W3: เพิ่มเค้กสามชั้น เทียน 16 เล่ม, ปุ่มเป่าเทียน และตัวเลือกไมค์ที่ขอสิทธิ์เฉพาะตอนกด; ช่อง `finalMessage` เว้นว่างไว้และไม่แตะข้อความลับที่เจ้าของให้ไว้ก่อนหน้า
- W4: ดาวตกที่ยังเคลื่อนอยู่กดได้, หยุดและแสดงการ์ดข้อความจาก `shootingStarMessages`; จำกัด 5 ครั้งและไม่เปิดทับ modal; ค่าข้อความว่างปิดฟีเจอร์
- W5: เพิ่ม signature effects สำหรับดาวศุกร์ (วงแสง), โลก (shader aurora), อังคาร (ฝุ่นแดง), พฤหัส (จุดแดงหมุน), เสาร์ (กลีบกุหลาบ) พร้อม slide modal จากตำแหน่งดาว; ปิดเมื่อ reduced-motion/`?fx=off`
- W6: เสียงดาวแต่ละดวงใช้โน้ตในสเกล pentatonic; เพิ่ม noise/filter sweep สำหรับ whoosh และ bell ตอนเทียนดับ; เสียงทั้งหมดเชื่อม mute เดิมและ output สำหรับบันทึกคลิป
- W7: ลดจำนวนดาว galaxy/background ลงประมาณ 15% ทุก tier
- W8: เพิ่มปุ่ม tilt mode บนมือถือ; ขอ permission ตอนกดบน iOS, ปรับมุมกล้องแบบ smoothed ±3°, สั่น 12ms ตอนเปิดความทรงจำ; ปิดเมื่อ reduced-motion หรือ `?fx=off`
- W9: เพิ่ม pointer stardust pool 60 จุด อายุ 0.6 วินาที และ streak แนวนอน/แนวตั้งตาม bass ของหัวใจ; ปิดเมื่อ reduced-motion หรือ `?fx=off`
- W10: countdown แสดงเฉพาะเมื่อเจ้าของกำหนดวัน ISO ใน config; `?now=` จำลองเวลา QA; วันว่างปิดหน้าจอ countdown
- W11: `?cinema=1` แสดงปุ่มอัดเฉพาะเมื่อ MediaRecorder/WebM และ canvas capture ใช้ได้; รวมเสียง Web Audio ถ้ามี, Escape หยุดและดาวน์โหลด `.webm`
- R2: เพิ่ม Mali local พร้อมไฟล์ OFL, ใช้กับการ์ดข้อความท้ายเกม; เตรียม `public/images/`; เพิ่ม OG/Twitter tags และ `public/og-birthday.png` ขนาด 1200×630 จากภาพ QA
- ไม่แก้ `memoriesData.js` และไม่เปลี่ยน placeholder รูป

การตรวจ:

- `npm run build` ผ่าน
- `npm audit` รายงาน 0 vulnerabilities
- `npm run visual:qa -- --phase=round2-R0` จบโดยไม่มี browser/page/console errors; ทดสอบดาวน์โหลด WebM จาก cinema recorder สำเร็จ และตรวจ `cinema-recording.png` ระหว่างอัด
- เปิดตรวจภาพ `name-front.png`, `bulge-closeup.png`, `orbit-visibility.png`, `arrival-constellation.png`, `final-heart.png`, `signature-earth.png`, `modal-slide.png`, `cinema-recorder.png`, `cake.png`, `cake-blown.png`, `portrait.png` และ `mobile.png` ใน `qa/round2-R0/`; ชื่อไม่กลับหัว/ไม่ซ้อน, bulge เป็นจุด, วงโคจรเห็นชัด, aurora/การ์ดความทรงจำ/เส้นหัวใจ/เค้ก/ปุ่ม tilt แสดง และเป่าเทียนทำงาน
- ภาพ arrival ใช้ QA pose ค้างอนุภาคช่วงแปรรูปเป็นตัวอักษร; เห็นกลุ่มอนุภาคแต่ภาพ SwiftShader ยังยืนยันการอ่าน “ขห” ไม่ได้ชัด จึงต้องตรวจบนอุปกรณ์จริง; ไม่ใช่การวัด animation/FPS จริง
- ไม่อ้าง FPS จาก SwiftShader และยังไม่ได้ทดสอบไมค์บนอุปกรณ์จริง

ยังรอข้อมูล/การตรวจจากเจ้าของ:

- `finalMessage`, `shootingStarMessages[]` และ `birthdayDate` ยังว่างตามข้อกำหนด; W4 และ W10 จึงไม่แสดงจนกว่าเจ้าของจะใส่ค่า
- R3: ทดสอบมือถือจริง 2 รุ่น, LINE/Instagram in-app browser, ไมค์, tilt iOS, WebGL context restore, FPS/draw calls และ LINE share preview; SwiftShader ไม่ยืนยันประสิทธิภาพจริง
- Push production รอบ 2 ไป `main` ด้วย commit `d714d98`; Vercel เสิร์ฟ bundle `index-D9ze1g9_.js` แล้ว ตรวจ OG metadata, `og-birthday.png` และ Mali font ได้ HTTP 200

`src/config/optionalFeatures.js` เก็บช่องเจ้าของ `finalMessage`, `shootingStarMessages` และ `birthdayDate` ซึ่งยังว่างอยู่ พร้อมย้ายข้อความลับที่เจ้าของให้ไว้เดิมมาเก็บใน config โดยคงถ้อยคำเดิมทุกตัว

## อัปเดตแผนรอบ 3 — 26 ตุลาคม 2026

ทำตามเฟส 1–5 โดยคงข้อความไทยเดิมและ `memoriesData.js`/รูป placeholder ไว้:

- เพิ่ม `src/core/uiDirector.js` สำหรับโซน UI, state visibility, TTL, การปิด/ลบ DOM และเหตุการณ์ cleanup; ย้าย popup, guide, ปุ่มฉาก, ปุ่ม tilt/อัดคลิป และป้ายคำอธิษฐานเข้า director พร้อมจัด z-index ผ่าน CSS variables
- เพิ่ม `src/core/flow.js` คุมสถานะและ generation ของฉาก; ยกเลิก timeline ที่ผูกกับ state เก่าและล็อกการคลิกดาวระหว่างบิน
- แก้กล่องคำอวยพรให้เห็นเฉพาะความทรงจำใบที่ 5; ฉากจบเริ่มหลังการ์ดใบสุดท้ายปิด; ปุ่มเค้กถูกถอดจริงหลังเป่าและเค้ก/ข้อความลับซ่อนพร้อม dispose เมื่อออกจากฉาก; หยุดไมค์เมื่อสำเร็จ เปลี่ยน state หรือซ่อนแท็บ
- จัดฉากจบเป็น ALIGN → HEART → CAKE → LETTER → EPILOGUE; หรี่/ซ่อนองค์ประกอบระบบดาวระหว่างแต่ละฉาก, หันเส้นหัวใจเข้ากล้อง, เพิ่มการ์ดจบเบาเมื่อ `?fx=off` และเพิ่มการกลับไปดูความทรงจำ/เริ่มเป่าใหม่/เก็บภาพ
- เพิ่มข้อความ 16 แบบ world text, caption ตอนโฟกัสดาว, beacon บอกสถานะดาว, reveal การ์ดเป็นขั้น และ cinematic color grade; ย้าย core/bulge ให้แสดงเฉพาะโหมดกาแล็กซี
- ย้ายข้อความลับมาเป็นวัตถุในฉากเค้กที่ depth-tested; หลังดูภาพพบว่าข้อความถูกเค้กบัง จึงขยับออกมาด้านหน้าและตรวจภาพซ้ำแล้ว อ่านได้ครบโดยไม่แก้ถ้อยคำเดิม
- เพิ่ม/ปรับ visual QA ให้เช็กการมองเห็น wish box, การลบปุ่มหลังเป่า, การซ้อนในโซน, และถ่ายภาพ final heart, cake lit/blown, `?fx=off`, focus caption, modal, low quality และ mobile

ตรวจในรอบนี้:

- `npm run build` ผ่านล่าสุดหลังแก้ตำแหน่งข้อความลับ; `git diff --check` ผ่าน
- QA ภาพก่อนหน้า `qa/round3-complete/` และ `qa/round3-final-verified/` ถูกเปิดดู; ตรวจซ้ำภาพ `qa/round3-final-heart-check/final-heart.png`, `qa/round3-cake-check/cake.png`, `qa/round3-cake-check/cake-blown.png`, `qa/round3-modal-check/modal-slide.png` และภาพล่าสุด `qa/round3-cake-message-check/cake.png`; ภาพข้อความลับล่าสุดแสดงครบและปุ่มเค้กหายหลังเป่า
- QA ครบชุดที่รันล่าสุด `round3-final` ปิด browser ระหว่างเปิดหลายฉาก WebGL จึงไม่ถือว่ารอบนั้นผ่าน; ใช้ผล QA แบบ targeted ที่จบพร้อมภาพประกอบแทน และไม่อ้างผล console/หน่วยความจำ/ประสิทธิภาพที่ไม่ได้ตรวจครบ
- ยังไม่ได้ทำ automated stress test เปิดดาวแบบสุ่ม 5 ลำดับและเป่าซ้ำ 5 รอบเพื่อตรวจ renderer resource; ยังไม่ได้ทดสอบมือถือจริง 2 รุ่น, LINE/Instagram, ไมค์จริง, tilt iOS หรือ FPS จริง
- ไม่แก้ `memoriesData.js`, รูป placeholder หรือ `src/config/optionalFeatures.js`; ข้อความลับยังคงเป็น `มีความสุขมากๆนะไอ่อ้วนน💗`
- Push `main` ด้วย commit `d7684ce` และ deploy production บน Vercel สำเร็จ 26 ตุลาคม 2026; deployment `dpl_3kbZnR16QGL98pFym8z72DBE9m98` สถานะ READY, alias `https://birthday-pi-wheat.vercel.app` ตอบ HTTP 200 และเสิร์ฟ `assets/index-BrI1JQwE.js`

### ตรวจทานความครบถ้วนของแผนรอบ 3 เพิ่มเติม — 26 ตุลาคม 2026

สถานะที่ถูกต้อง: **ยังไม่ผ่านเกณฑ์ครบทุกข้อของแผน** แม้โค้ดหลักหลายส่วนทำแล้วและ deploy อยู่ production; รายการด้านบนเป็นบันทึกสิ่งที่ทำ ไม่ใช่การรับรองว่า acceptance criteria ทั้งหมดผ่าน

ช่องว่างที่ตรวจพบจากการเทียบแผนกับ implementation:

- QA ยังไม่ครอบคลุมชุดภาพที่แผนระบุ: ไม่มีภาพ/การตรวจ state S0–S8 ครบ, memory reveal ทีละขั้น, focus ครบ 5 ดาว, `FINALE_LETTER`, mobile landscape และ overlap check ยังถูกรันเฉพาะฉากท้ายบางฉาก ไม่ได้วัดจำนวน element ตาม allowlist ทุก state
- ยังไม่ได้ automate สถานการณ์สุ่มลำดับเปิดดาว 5 แบบ, คลิกรัว/resize ระหว่างบิน, สลับแท็บ, ไมค์ถูกปฏิเสธ, reduced-motion และเป่าเทียนซ้ำ 5 รอบพร้อมเทียบ `renderer.info`; full visual run ล่าสุด browser ปิดระหว่างเปิดฉาก WebGL หลายหน้า
- เมนูปุ่มรอง ⋯ บนมือถือไม่ได้ทำ; ปุ่มรองยังวางแยกกัน และ guide กับ action slot เค้กมีรูปแบบ/ตำแหน่งต่างจาก storyboard บางจุด
- storyboard S0/S1/S2 ยังไม่ได้ปรับครบ: loading ไม่มี iris เปิดม่าน, intro ยังเป็น overlay เดิม ไม่ได้รีวีลตัวอักษรบนฉาก 3D, และ flight caption/lower-third ตามบรรทัดยังไม่มี
- S3 ใช้ canvas plane แสดงวลีอายุ 16 ไม่ใช่เลข “16” แบบ 3D/extruded ตามแบบ; caption อยู่กลางจอและยังไม่ตรวจจังหวะแตะข้ามแต่ละขั้น
- finale จัดดาวเป็นตำแหน่งวงโค้งแล้ว แต่หัวใจใหญ่ไม่ได้ย่อเป็นฐานเค้ก; เค้กไม่มีเสียงติ๊กตอนจุดเทียน; secret message เป็นแผ่นข้อความตรงใต้หน้าเค้ก ไม่ใช่แคปชั่นโค้งและไม่มี wipe reveal
- `flow.go()` kill tweens แค่ camera/controls/orbitClock; delayed calls, timeouts และ signature/effect timelines ไม่ได้ถูกผูกทั้งหมดกับ state/generation จึงยังยืนยัน dismissal/cleanup contract ครบไม่ได้
- ไม่ได้ตรวจด้วยตาว่าทุกภาพที่แผนกำหนดครบ เพราะภาพเหล่านั้นยังไม่ได้สร้าง; ภาพ targeted ที่เปิดดูยืนยันเฉพาะฉากที่บันทึกไว้เท่านั้น

ดังนั้น production ปัจจุบันมี implementation รอบ 3 ที่ใช้งานได้สำหรับ flow ที่ตรวจแล้ว แต่ไม่ควรเรียกว่าแผนรอบ 3 เสร็จครบจนกว่าจะปิดรายการข้างต้นและรัน QA ตาม acceptance criteria สำเร็จ

### Checkpoint งานต่อ — 26 ตุลาคม 2026

- เพิ่มเมนู `⋯` สำหรับจอไม่เกิน 520px ให้ปุ่มอธิษฐาน/tilt/อัดคลิปเปิดจากเมนู; QA targeted ตรวจสถานะปิด/เปิดและตรวจ rect ไม่ให้ปุ่มชนกัน ภาพอยู่ใน `qa/round3-mobile-tools-check/`
- พบการชนของปุ่ม wish กับ tilt จากภาพ QA ครั้งแรก แล้วจัดทั้งสองให้อยู่ขวาเป็นแนวตั้ง; ภาพเปิดล่าสุดแสดงไม่ซ้อน
- เพิ่ม animation ย่อเส้นหัวใจใหญ่เมื่อเข้าสู่เวทีเค้กและคืนขนาดเมื่อออก; เพิ่มเสียงโน้ตเบาตอนเทียนแต่ละเล่มติด
- เพิ่ม `flow.after()` สำหรับ timeout ที่เปลี่ยนผ่าน finale/epilogue ให้ถูกยกเลิกเมื่อ state เปลี่ยน
- `npm run build` ผ่านหลังเพิ่มเมนู/animation/เสียง; targeted mobile QA ผ่านหลังแก้ตำแหน่ง (สคริปต์จบและสร้างภาพทั้งสองสถานะ); `git diff --check` ผ่าน
- การเปลี่ยนแปลง checkpoint นี้ยัง **ไม่ได้ deploy production**; production ยังเป็น deployment เดิม `dpl_3kbZnR16QGL98pFym8z72DBE9m98`
- งานต่อเมื่อ resume: ทำ storyboard S0–S8 ที่ยังขาด, curved/wipe cake caption, state cleanup สำหรับ timeline/callback ทุกจุด, ขยาย automated scenario/image matrix (รวมสุ่มดาว 5 แบบ, resize/visibility, reduced motion, mic denial, repeat cake/resource counts และ mobile landscape), ตรวจภาพทั้งหมด, build/QA แล้ว deploy production

### ผลปิดงานรอบ 3 — 26 ตุลาคม 2026

บันทึกนี้แทนสถานะ/รายการค้างใน checkpoint และการตรวจทานก่อนหน้าข้างบน ซึ่งเขียนไว้ก่อนทำงานต่อ:

- ภาพตามฉากถูกสร้างและเปิดตรวจ: loading, intro, flight caption, เลข 16, arrival caption, explore, focus ครบ 5 ดาว, memory reveal 4 ขั้นและการ์ดใบที่ 5, finale align/heart, cake lit/blown, epilogue, `?fx=off`, mobile portrait/tools และ mobile landscape; ไฟล์อยู่ในโฟลเดอร์ `qa/round3-*`
- เพิ่ม QA สำหรับสุ่มลำดับ 5 ชุด; ทั้ง `3→1→5→4→2`, `1→2→3→4→5`, `5→4→3→2→1`, `2→4→1→5→3` และ `4→2→5→1→3` ผ่าน โดยไม่เริ่มฉากจบก่อนปิดการ์ดใบที่ 5
- Flow stress ผ่าน: คลิกรัว/กด Escape/resize ระหว่างบิน, ตรวจ UI layer ต่อ state, ทดสอบไมค์ถูกปฏิเสธแล้วเป่าเทียนด้วยปุ่มได้, ตรวจลบปุ่มหลังเป่า และเป่าเค้กซ้ำ 5 ครั้งโดย geometry/texture ใน `renderer.info` ไม่เพิ่มต่อรอบ
- ตรวจพบและแก้ texture จากแฟลชพลุดาวไม่ถูก dispose; แก้ตำแหน่งข้อความลับบนเค้กไม่ให้ชน action slot; เพิ่มการตรวจ overlap ใน mobile landscape และจัดวางแถบเครื่องมือให้ไม่ตัดคำหรือชนปุ่ม
- Reduced-motion และ `?fx=off` ผ่าน QA แบบ targeted; ภาพตรวจข้อความลับแสดงตรงตาม `มีความสุขมากๆนะไอ่อ้วนน💗`; ไม่แก้ข้อความไทยเดิม, `memoriesData.js`, `optionalFeatures.js` หรือ placeholder รูป
- `npm run build`, `node --check scripts/visual-qa.mjs` และ `git diff --check` ผ่านหลังการแก้ล่าสุด; ไม่ใช้ SwiftShader เพื่ออ้าง FPS

ข้อจำกัดที่ยังต้องให้เจ้าของตรวจบนอุปกรณ์จริง: มือถืออย่างน้อย 2 รุ่น, LINE/Instagram in-app browser, ไมค์และ tilt บน iOS, WebGL context restore และประสิทธิภาพ/FPS จริง รูปความทรงจำยังคงเป็น placeholder ตามที่เจ้าของจะส่งรูปภายหลัง; `finalMessage` ยังว่าง จึงไม่มีหน้าจอจดหมายแบบกำหนดเองให้ทดสอบ

การ deploy รอบนี้สำเร็จ: commit `bbf7b5c` ถูก push ไป `main`; Vercel deployment `dpl_3hjEL4DnXsDnAutDQYHZUwvNuvCG` สถานะ READY, production alias `https://birthday-pi-wheat.vercel.app` ตอบ HTTP 200 และหน้าเว็บโหลด `assets/index-CBxQ6oaE.js` / `assets/index-Dhc0DyEQ.css` ตรงกับ build ล่าสุด.

### ผลปิดงานรอบ 4 (แก้บัคฉากเค้ก · ชื่อ "ข้าวหอม" 3D · ภาพความทรงจำจริง · การย้อนกลับฉาก) — 26 ตุลาคม 2026

ดำเนินงานครบถ้วนตาม [แผนรอบ 4.md](./แผนรอบ 4.md) โดยเน้นแก้บัคให้หมดก่อน และคงถ้อยคำภาษาไทยเดิม 100% (Verbatim Preservation):

#### 1. สรุปการแก้ไขบัคและฟีเจอร์หลัก (Phase 1–5):
- **ฉากเค้กวันเกิด 3D (Cosmic Birthday Cake Overhaul)**:
  - ออกแบบเค้ก 3 ชั้นสไตล์พาสเทลหรูหรา (Lavender `#b99af0`, soft pink `#f7a8c8`, warm cream `#fff0e0`) ขอบทอง เดินลูกปัดมุก 78 เม็ดด้วย `InstancedMesh` พร้อมครีมหยดรอบชั้น
  - จานรองเค้กสี Rose Gold รัศมี 21.5 มิติหนา 2.8 หน่วย
  - ฐานวางเทียน 16 เล่ม จัดกระจาย 2 ระดับอย่างสมดุล (ชั้นกลางสีชมพู 10 เล่ม, ชั้นบนสีครีม 6 เล่ม) แก้ปัญหาเทียนซ้อนทับมุมมองกล้อง โดยมีระยะห่างขั้นต่ำบนหน้าจอ **1.19% – 1.21%** (เกินเกณฑ์กำหนด ≥ 1.0%)
  - เปลวเทียนทรงหยดน้ำ (Teardrop) แกนในสีขาวสว่างส่องประกายส้มทองบริสุทธิ์ (ไม่มีโทนชมพูเจือปน)
  - แสงเทียน `PointLight` สีส้มอุ่น (`0xffb066`, y=14.5) สว่างสมจริง
  - **ซ่อนวัตถุ 3D อื่นเด็ดขาด**: ในโหมดเค้ก ดาวเคราะห์ วงโคจร ละอองดาว memory links ประกายไฟ บีคอน และเส้น pointer star trail / heart streak ถูกตั้ง `visible = false` อย่างสมบูรณ์ เหลือเฉพาะเค้ก เทียน หัวใจ topper ท้องฟ้ากาแล็กซี และพลุดาวตก
  - ข้อความลับ `"มีความสุขมากๆนะไอ่อ้วนน💗"` จัดวางที่พิกัด `(0, -13.5, 22)` ลอยเด่นเหนือแผงปุ่มควบคุมด้านล่างอย่างชัดเจน ไม่อยู่หลังเค้กหรือถูกบัง
  - **การย้อนกลับฉาก (Epilogue Return)**: เมื่อคลิกย้อนกลับจากฉากจบ เส้นวงโคจรคืนความสว่างที่ opacity 0.28 อย่างนุ่มนวล วัตถุในระบบดาวกลับสู่สภาวะปกติ
- **ความเด่นชัดของชื่อ "ข้าวหอม" (Hero 3D Typography)**:
  - ใช้ `SVGLoader` สร้าง Thai Extruded Geometry เสริมด้วย Canvas Stack Layering และวัสดุคู่ (หน้าทองชมพู/ครีม + ขอบเรืองแสงบานเย็นเข้มสดใส `0xdb2777`)
  - เสริม Front Key Light (`0xfffaed`, intensity 1.4) และ Purple Backlight (`0xc084fc`, 180) พร้อมรัศมีละอองดาว 48 เม็ดลอยรอบตัวอักษร
  - ปรับขนาดในโหมด Arrival Reveal ให้สูงเด่น **48.4%** ของจอ (เกินเกณฑ์ ≥ 14%) และกว้าง **84.7%** ของจอ (เกินเกณฑ์ ≥ 45%) ตรึงสายตา ≥ 2.4 วินาที
  - จัดลำดับช่วงเข้าถึงดาว (Arrival Celebration): เลข "16" เรืองแสง (0.3s) → ชื่อ "ข้าวหอม" 3D มหึมา (1.6s) → แคปชั่น Lower-third เน้นชื่อ `<strong class="name-emph">ข้าวหอม</strong>` (4.5s) → ปุ่มไกด์เปิดการ์ด
  - หัวการ์ด HUD ด้านบนห่อหุ้มชื่อด้วย `<span class="hud-name-emph">ข้าวหอม</span>` ชัดเจน
- **ภาพถ่ายความทรงจำจริงของผู้ใช้ (Real Memory Photos Integration)**:
  - บันทึกและเชื่อมโยงภาพถ่ายจริง 4 ภาพที่ผู้ใช้ส่งมอบลงใน 5 ช่องความทรงจำ (`public/images/memory-[1..5].jpg`) โดยรูปที่ 5 ใช้ภาพถ่ายแนวตั้งอย่างลงตัว
  - อัปเดต `src/config/memoriesData.js` ให้โหลดจาก `${import.meta.env.BASE_URL}images/memory-X.jpg` พร้อมคงข้อความบรรยายภาษาไทยเดิมครบทุกตัวอักษร 100%
- **Scene Audit & Performance Verification**:
  - ตรวจสอบความสะอาดของ Scene ผ่าน `window.__qaSceneAudit()` พบวัตถุที่ได้รับอนุญาต 136 รายการ และ 0 วัตถุแปลกปลอม
  - ทดสอบความคงทนเป่าเทียนซ้ำ 5 รอบ (5-cycle blowout repeat stress test) พบทรัพยากร Three.js คงที่สมบูรณ์ (Geometries 164, Textures 51) ไม่มี Memory leak
  - Build ผ่าน production ด้วย Vite สำเร็จในเวลาเพียง < 1 วินาที (847ms)

#### 2. ผลการตรวจสอบด้วยภาพ (Visual QA 13 รายการใน `qa/round4-all/`):
| ภาพ QA | รายละเอียดการตรวจสอบ | ผลการตรวจ |
| :--- | :--- | :--- |
| `cake-front.png` | เค้กพาสเทล 3 ชั้น เทียน 16 เล่ม เปลวไฟหยดน้ำ จานโรสโกลด์ ไม่มีดาวเคราะห์แทรก | **ผ่าน (PASS)** |
| `cake-lit.png` | แสงเทียนสีส้มสว่างเรืองรอง กระจายตัวรอบ 2 ชั้น ไม่ทับซ้อนกัน | **ผ่าน (PASS)** |
| `cake-top.png` | มุมมองจากด้านบน เทียนกระจายรัศมีวงกลมสวยงามสมดุล | **ผ่าน (PASS)** |
| `cake-blown.png` | เทียนดับสนิททั้ง 16 เล่ม ข้อความลับลอยเด่นชัดเจนเหนือแผงปุ่มด้านล่าง | **ผ่าน (PASS)** |
| `finale-align.png` | ดาวเคราะห์ 5 ดวงจัดเรียงเป็นแนวโค้งรับฉากจบอย่างลงตัว | **ผ่าน (PASS)** |
| `finale-heart.png` | กลุ่มดาวเชื่อมต่อเป็นเส้นหัวใจเรืองแสงเข้าหากล้อง | **ผ่าน (PASS)** |
| `epilogue-return.png` | การเปลี่ยนผ่านกลับสู่ระบบดาว เส้นท่อวงโคจรเรืองแสงคืนระดับ 0.28 ราบรื่น | **ผ่าน (PASS)** |
| `galaxy-name.png` | ชื่อ "ข้าวหอม" 3D ขนาดมหึมาลอยสง่างามในอวกาศลึกหลังระบบสุริยะ | **ผ่าน (PASS)** |
| `arrival-16.png` | ตัวเลข 16 เคลือบแก้วสะท้อนแสงสีครีมชมพูทอง ณ ใจกลางดาวลูกหมู | **ผ่าน (PASS)** |
| `arrival-name.png` | ตัวอักษร "ข้าวหอม" 3D ขนาดยักษ์กลางจอ มีแสง key light คมชัดระดับพรีเมียม | **ผ่าน (PASS)** |
| `arrival-caption.png` | แคปชั่น lower-third เน้นตัวหนา `<strong class="name-emph">ข้าวหอม</strong>` อ่านง่าย | **ผ่าน (PASS)** |
| `cake-front-portrait.png` | หน้าจอแนวตั้งมือถือ เค้กและปุ่มกดจัดวางสมดุล ไม่ทับซ้อน UI เครื่องมือ | **ผ่าน (PASS)** |
| `arrival-name-portrait.png`| การแสดงชื่อบนจอมือถือ กว้างเด่นเต็มสายตา สวยสะกดทุกมุมมอง | **ผ่าน (PASS)** |

#### 3. คำแนะนำในการทดสอบบนอุปกรณ์จริง (Physical Device Testing):
1. **iPhone (iOS Safari / LINE / Instagram in-app)**:
   - ทดสอบเปิดลิงก์และแตะหน้าจอเพื่อเริ่มเสียงเพลง
   - ทดสอบการเป่าเทียนด้วยไมโครโฟนจริง (หากอนุญาตสิทธิ์ไมค์) หรือแตะปุ่มเป่าเทียน
   - ทดสอบฟังก์ชัน Gyroscope / Tilt หมุนเครื่องเพื่อชมมุมมองรอบเค้ก
2. **Android (Chrome / LINE)**:
   - ตรวจสอบความลื่นไหลของ WebGL 60 FPS และการแสดงผลภาพความทรงจำทั้ง 5 ใบ

---

## แผนรอบ 5: ระบบไกด์ "กดอะไรก่อน" + ปิดงานบัคให้สมบูรณ์ (สรุปผลการดำเนินงานจริง)

อัปเดต: 26 ตุลาคม 2026
สถานะ: **เสร็จสมบูรณ์ตามข้อกำหนด, ผ่านการตรวจ Visual QA 25 ภาพ และ Deploy ขึ้น Production บน Vercel เรียบร้อยแล้ว** (Commit `61599f0`)

---

### 1. สรุปการแก้ไขบัคและ UX Polish (R5-1 ถึง R5-6)

| รหัสบัค | ปัญหาเดิม | แนวทางแก้ไขและผลลัพธ์ | ไฟล์ที่แก้ไข |
| :--- | :--- | :--- | :--- |
| **R5-1** | ภาพความทรงจำใบที่ 4 และ 5 ซ้ำกัน (`memory-4.jpg` และ `memory-5.jpg`) | ออกแบบระบบ **2x2 Photo Mosaic Collage** สำหรับใบที่ 5 เพื่อรวบรวมช่วงเวลาความทรงจำทั้ง 4 ภาพแรกอย่างมีระดับ พร้อมตั้งค่า fallback ให้แสดงผลได้สมบูรณ์ หากในอนาคตผู้ใช้มีภาพเดี่ยวใบใหม่ สามารถใส่ลงใน `public/images/memory-5.jpg` และลบฟิลด์ `collage` ได้ทันที (ข้อความภาษาไทยเดิมคงไว้ 100%) | `src/config/memoriesData.js`<br>`src/ui/polaroidModal.js`<br>`src/style.css` |
| **R5-2** | ภาพแนวตั้งตัดขอบหน้าคน (Cropping) และมองรายละเอียดไม่ชัด | 1. กำหนด `imagePosition` แบบกำหนดเองต่อใบ เช่น รูป #3 และ #4 ปรับ `50% 55%` และ `50% 52%` เพื่อให้จุดสนใจอยู่บนใบหน้า/บุคคล ไม่หลุดไปติดท้องฟ้ามืด<br>2. เพิ่มระบบ **Fullscreen Lightbox** เมื่อแตะที่รูปภาพ จะขยายดูภาพต้นฉบับขนาดเต็มแบบ uncropped ไม่โดนตัดขอบ สามารถกด Esc หรือปุ่ม ✕ เพื่อปิดได้ | `src/config/memoriesData.js`<br>`src/ui/polaroidModal.js`<br>`src/style.css` |
| **R5-3** | ข้อความลับใต้เค้กชนขอบจานรองเค้ก (Rim Clash) | ปรับตำแหน่งป้ายข้อความลงด้านล่างใต้จานเค้กที่พิกัด `y = -15.4, z = 23.5`, ขยายขนาดฟอนต์ขึ้น 15% (82px), และเพิ่มพื้นหลังเงาดำไล่เฉดเรเดียล `rgba(12, 5, 20, 0.88)` ทำให้ตัวอักษรลอยเด่น คมชัด อ่านง่าย ไม่ซ้อนทับขอบจาน | `src/scene/cosmicCake.js` |
| **R5-4** | บีคอนดาวเคราะห์ลอยแย่งสายตาตอนเปิดชื่อ "ข้าวหอม" + เลข 16 บางเกินไป | 1. ซ่อนบีคอนและป้ายชื่อดาวเคราะห์ทั้งหมดระหว่างฉาก Arrival Number 16 และ Name Reveal แล้วค่อยๆ เฟดกลับมาอย่างนุ่มนวลเมื่อเข้าสู่โหมด Explore<br>2. ปรับลดความฟุ้ง (bloom blowout) บนตัวอักษร "ห" และปรับเลข 16 ให้หนาขึ้น (`tubeRadius: 1.05`, `scale: 1.15`) มีมิติสะท้อนแสงพรีเมียม | `src/scene/solarSystemHeart.js`<br>`src/scene/arrivalNumber.js`<br>`src/scene/name3DText.js` |
| **R5-5** | บีคอนมองยากในมุมไกล และผู้ใช้ไม่รู้ว่าต้องไปดาวดวงไหนต่อ | 1. ปรับบีคอนให้เป็น High Contrast พร้อมเอฟเฟกต์ Pulsing Beacon Aura และป้ายตัวเลขบอกลำดับดาว `01` ถึง `05`<br>2. ดาวดวงถัดไปที่ยังไม่ได้สำรวจจะมีวงแหวนไฮไลต์สีทองหมุนเด่น และเพิ่ม Action Chip `#hud-next-chip` บนหน้าจอระบุชื่อดาวดวงถัดไปทันที | `src/scene/solarSystemHeart.js`<br>`src/ui/hudOverlay.js`<br>`src/core/progress.js` |
| **R5-6** | ปุ่ม Vinyl แผ่นเสียงแสดงสถานะชวนสับสน, ปุ่ม Reset มุมกล้องไม่ชัดเจน, ขาดปุ่มช่วยเหลือ | 1. ปรับป้ายกำกับปุ่ม Vinyl ให้แยกชัดเจนระหว่าง **สถานะ** กับ **แอ็กชัน**: "เพลงเปิดอยู่ · แตะเพื่อปิด" vs "แตะเพื่อเปิดเพลง"<br>2. เปลี่ยนไอคอนปุ่ม Reset กล้องเป็นเป้าเล็ง 🎯 พร้อม Tooltip "กลับมาที่หัวใจกลาง"<br>3. เพิ่มคลาส `.is-galaxy-active` เรืองแสงรอบปุ่มท่องกาแล็กซีเมื่อกำลังใช้งาน<br>4. เพิ่มคำแนะนำเสียงบนหน้าจอ Intro: "เปิดเสียงไว้ด้วยนะ 🔊" และปุ่มเครื่องหมายคำถาม (?) สำหรับเปิดแผ่นคู่มือสรุปวิธีเล่น | `src/ui/hudOverlay.js`<br>`src/ui/introScreen.js`<br>`src/style.css` |

---

### 2. สถาปัตยกรรมระบบไกด์ "กดอะไรก่อน" (Guide System)

สร้างระบบแนะนำผู้ใช้อัจฉริยะที่คอยนำทางอย่างนุ่มนวล ไม่สร้างความรำคาญ และไม่ขัดขวางการสำรวจ:

1. **คลังข้อความกลาง (`src/config/guideCopy.js`)**:
   - ข้อความคำแนะนำทั้งหมดถูกรวมไว้ในไฟล์นี้ไฟล์เดียวตามมาตรฐาน Single Source of Truth
   - แบ่งหมวดหมู่ชัดเจน: `intro`, `tour`, `explore`, `memory`, `finale`, `cake`, `epilogue`, `help`
   - ปลอดภัยต่อข้อความเดิมของผู้ใช้ ไม่มีการแก้ไขถ้อยคำใน `memoriesData.js` หรือ `secretMessage`

2. **ระบบติดตามความคืบหน้า (`src/core/progress.js`)**:
   - บันทึกดวงดาวที่เปิดแล้ว (`visitedSet`), คำนวณดาวดวงถัดไปตามลำดับ 1 ถึง 5 (`getNextMemoryId()`)
   - ยิง Event แจ้งเตือนเมื่อมีความคืบหน้า เพื่ออัปเดต HUD และบีคอนในฉาก 3D แบบเรียลไทม์

3. **ผู้กำกับไกด์ (`src/ui/guideDirector.js`)**:
   - **Spotlight Focus**: ทำไฮไลต์วงกลมมืดล้อมรอบปุ่มหรือวัตถุ 3D เป้าหมาย
   - **3D Planet Tracking & Edge Arrow**: ติดตามพิกัด 3D ของดาวเคราะห์บนหน้าจอ หากดาวอยู่นอกกรอบสายตา จะแสดงลูกศรชี้ขอบจอ (Screen-edge Indicator) นำทางให้ผู้ใช้หันกล้องไปหา
   - **Idle Nudges**: ถ้านิ่งเฉยเกิน 8 วินาที ชิปด้านบนจะกระพริบเตือน, นิ่งเกิน 18 วินาทีจะแสดงบอลลูนไกด์สปอตไลต์ชี้ดาว, และ 35 วินาทีจะแสดงลูกศรนำทาง
   - **Non-blocking & Single Guide Contract**: กำหนดให้มีบอลลูนไกด์แสดงได้สูงสุด 1 ตัวเท่านั้นในเวลาเดียวกัน ฉากหลังของไกด์เป็น `pointer-events: none` ทั้งหมด ไม่ปิดกั้นการคลิกหรือหมุนกล้อง 3D

4. **ทัวร์แนะนำปุ่ม HUD (`src/ui/guideTour.js`)**:
   - เมื่อเข้าสู่โหมด Explore ครั้งแรก จะมีทัวร์ 5 สเต็ปแนะนำปุ่มสำคัญ:
     1. ปุ่มดาวน์โหลด/เก็บภาพ 📸
     2. ปุ่มคำอธิษฐาน/กล่องข้อความ 💌
     3. ปุ่มรีเซ็ตมุมกล้อง 🎯
     4. ปุ่มท่องกาแล็กซี่ 3D 🌌
     5. ปุ่มควบคุมเสียงเพลง 🎵
   - บันทึกสถานะ `tourSeen` ลงใน `sessionStorage` เพื่อไม่ให้แสดงซ้ำเมื่อผู้ใช้รีเฟรชหน้า

5. **แผ่นคู่มือสรุปวิธีเล่น (`src/ui/guideHelpSheet.js`)**:
   - เปิดได้ตลอดเวลาผ่านปุ่ม `?` บนแถบ HUD
   - แสดงรายการฟังก์ชันทั้งหมดพร้อมปุ่ม "ลองเลย" สำหรับนำทางไปยังฟีเจอร์นั้นทันที
   - มีปุ่ม "ดูไกด์อีกครั้ง" สำหรับผู้ที่ต้องการเล่นทัวร์ซ้ำ

---

### 3. ผลการตรวจสอบด้วยภาพ (Visual QA 25 รายการใน `qa/round5-all/`)

รันการทดสอบอัตโนมัติด้วยคำสั่ง `npm run visual:qa -- --phase=round5-all` ผ่านสมบูรณ์ (Exit code 0):

| ลำดับ | ภาพบันทึก QA | รายละเอียดการตรวจสอบ | ผลการตรวจ |
| :---: | :--- | :--- | :---: |
| 1 | `guide-intro.png` | หน้าจอเปิดพร้อมข้อความเตือนเปิดเสียง "เปิดเสียงไว้ด้วยนะ 🔊" และ CTA แนะนำ | **ผ่าน (PASS)** |
| 2 | `guide-explore-first.png`| สปอตไลต์ไฮไลต์ดาวเคราะห์ดวงที่ 1 พร้อมมือชี้และข้อความแนะนำการแตะดาว | **ผ่าน (PASS)** |
| 3 | `guide-next-chip.png` | ชิปบอกเป้าหมายบน HUD "👉 ต่อไป: 01 ดาวศุกร์" ลอยเด่นสวยงาม | **ผ่าน (PASS)** |
| 4 | `guide-tour-1.png` | ทัวร์สเต็ป 1: แนะนำปุ่มเก็บภาพความทรงจำ 📸 | **ผ่าน (PASS)** |
| 5 | `guide-tour-2.png` | ทัวร์สเต็ป 2: แนะนำปุ่มเขียนคำอธิษฐาน 💌 | **ผ่าน (PASS)** |
| 6 | `guide-tour-3.png` | ทัวร์สเต็ป 3: แนะนำปุ่มรีเซ็ตมุมกล้อง 🎯 | **ผ่าน (PASS)** |
| 7 | `guide-tour-4.png` | ทัวร์สเต็ป 4: แนะนำปุ่มสลับมุมมองท่องกาแล็กซี่ 🌌 | **ผ่าน (PASS)** |
| 8 | `guide-tour-5.png` | ทัวร์สเต็ป 5: แนะนำปุ่มเล่น/หยุดเพลง 🎵 | **ผ่าน (PASS)** |
| 9 | `guide-idle2.png` | บอลลูนเตือนความเงียบ 18 วินาที พร้อมชี้เป้าหมายดาวเคราะห์ | **ผ่าน (PASS)** |
| 10 | `guide-edge-arrow.png` | ลูกศรนำทางขอบจอ ชี้ทิศทางดาวเป้าหมายที่อยู่นอกขอบมุมมอง | **ผ่าน (PASS)** |
| 11 | `guide-help-sheet.png` | แผ่น Help Sheet สรุปวิธีเล่นพร้อมปุ่ม "ลองเลย" และ "ดูไกด์อีกครั้ง" | **ผ่าน (PASS)** |
| 12 | `memory-1-desktop.png` | การ์ดความทรงจำ #1 Desktop: ไกด์ "อ่านจบแล้วกด 'ความทรงจำถัดไป' หรือ ✕ เพื่อกลับ ✨" | **ผ่าน (PASS)** |
| 13 | `memory-1-portrait.png`| การ์ดความทรงจำ #1 Mobile: สัดส่วนภาพพอดี เห็นใบหน้าชัดเจน ไม่ตกขอบ | **ผ่าน (PASS)** |
| 14 | `memory-1-lightbox.png`| Fullscreen Lightbox: แสดงภาพถ่ายเต็มตา คมชัด ไร้การครอป | **ผ่าน (PASS)** |
| 15 | `memory-2-desktop.png` | การ์ดความทรงจำ #2 Desktop: จัดองค์ประกอบ `imagePosition: 50% 22%` คมชัด | **ผ่าน (PASS)** |
| 16 | `memory-2-portrait.png`| การ์ดความทรงจำ #2 Mobile: ไม่ตัดหัวหรือหน้าบุคคล | **ผ่าน (PASS)** |
| 17 | `memory-3-desktop.png` | การ์ดความทรงจำ #3 Desktop: `imagePosition: 50% 55%` เลื่อนจุดสนใจจากท้องฟ้าลงมาที่คน | **ผ่าน (PASS)** |
| 18 | `memory-3-portrait.png`| การ์ดความทรงจำ #3 Mobile: เห็นชุดและบุคคลครบถ้วน | **ผ่าน (PASS)** |
| 19 | `memory-4-desktop.png` | การ์ดความทรงจำ #4 Desktop: `imagePosition: 50% 52%` สมดุลสวยงาม | **ผ่าน (PASS)** |
| 20 | `memory-4-portrait.png`| การ์ดความทรงจำ #4 Mobile: สัดส่วนแนวตั้งอ่านข้อความและเห็นรูปชัดเจน | **ผ่าน (PASS)** |
| 21 | `memory-5-desktop.png` | การ์ดความทรงจำ #5 Desktop: โมเสก 2x2 Collage สวยงาม พร้อมกล่องคำอวยพร | **ผ่าน (PASS)** |
| 22 | `memory-5-portrait.png`| การ์ดความทรงจำ #5 Mobile: แสดง 2x2 กริดย่อส่วนลงตัวในจอมือถือ | **ผ่าน (PASS)** |
| 23 | `guide-after-close.png`| ไกด์ชมเชยหลังปิดการ์ด "เก่งมาก! 1/5 แล้ว · ดวงต่อไป: โลก" พร้อมหัวใจดวงแรกเต็ม | **ผ่าน (PASS)** |
| 24 | `guide-cake.png` | ไกด์ฉากเค้ก "อธิษฐานแล้วแตะ 'เป่าเทียนเลย' หรือเปิดไมค์แล้วเป่า 🎂" + ข้อความลับพ้นขอบจาน | **ผ่าน (PASS)** |
| 25 | `guide-epilogue.png` | ไกด์ฉากจบ สรุปการเดินทางและปุ่มชวน "ดูความทรงจำอีกรอบ" / "เริ่มใหม่" | **ผ่าน (PASS)** |

---

### 4. คำแนะนำและการทดสอบบนอุปกรณ์จริง (Physical Device Checklist)

> [!WARNING]
> **หมายเหตุสำคัญเรื่อง Performance และ SwiftShader**:
> การรัน Headless Visual QA บนเซิร์ฟเวอร์ใช้ซอฟต์แวร์ประมวลผลกราฟิก SwiftShader ของ Chromium ซึ่งใช้ CPU เรนเดอร์ จึงไม่สามารถนำตัวเลข FPS หรือความเร็วมาใช้อ้างอิงการใช้งานจริงได้ บนอุปกรณ์จริงที่มี GPU จะทำงานได้ที่ระดับ 60 FPS อย่างลื่นไหล

**สิ่งที่เจ้าของควรทดสอบบนโทรศัพท์มือถือจริงก่อนส่งมอบให้ข้าวหอม**:
1. **iPhone (Safari & LINE In-App Browser)**:
   - ทดสอบแตะหน้าจอเพื่อเริ่มเล่นเสียงเพลง (เนื่องจาก iOS ปิด autoplay เสียงตามนโยบายระบบ)
   - ทดสอบแตะที่รูปถ่ายในโหมดความทรงจำ เพื่อทดสอบเปิดดู Fullscreen Lightbox
   - ทดสอบกดปุ่มเป่าเทียน หรือเป่าลมเข้าไมโครโฟนจริง (หากกดอนุญาตสิทธิ์ไมค์)
2. **Android (Chrome & LINE In-App Browser)**:
   - ตรวจสอบความสมูทในการแพนและหมุนกล้องรอบระบบสุริยะ
   - ตรวจสอบว่ารูปโมเสก 2x2 ในความทรงจำใบที่ 5 แสดงผลเรียงกัน 4 ช่องคมชัด
3. **ทางเลือกสำหรับรูปที่ 5 ในอนาคต**:
   - หากในอนาคตเจ้าของมีภาพเดี่ยวใบที่ 5 ที่ต้องการใส่แทนโมเสก สามารถนำไฟล์รูปไปวางทับที่ `public/images/memory-5.jpg` และนำบรรทัด `collage: [1, 2, 3, 4],` ออกจาก `src/config/memoriesData.js` ได้อย่างง่ายดาย

---

### 5. สถานะการ Deploy บน Production (Vercel)

- **Production URL**: https://birthday-pi-wheat.vercel.app
- **Git Commit**: `61599f0` (branch: `main`)
- **Production Asset Bundle**: `assets/index-DvdZumnE.js` และ `assets/index-0mMAda7-.css`
- **HTTP Response Verification**: 200 OK (ตอบสนองสมบูรณ์ทุก Asset)
- **วันเวลาที่ Deploy**: 26 ตุลาคม 2026 เวลา 13:45 น. (GMT+7)

---

## แผนรอบ 6: แก้บัคฉาก Arrival · รวม Dock ปุ่มมือถือ · ยกระดับฉากละอองดาว "ข้าวหอม" (Phases A–E)

อัปเดต: 26 ตุลาคม 2026
สถานะ: **เสร็จสมบูรณ์ตามข้อกำหนดทุกข้อ, ผ่านการตรวจ Automated Visual QA (Round 6) รหัสผ่าน 100%, และพร้อม Deploy ขึ้น Production บน Vercel**

---

### 1. รายละเอียดการแก้ไขในแต่ละเฟส (Phases A–E)

| เฟส | ปัญหาเดิมและขอบเขตงาน | แนวทางแก้ไขและผลลัพธ์ | ไฟล์ที่แก้ไข |
| :---: | :--- | :--- | :--- |
| **A** | **บัคซ้อนกันในฉาก Arrival**<br>• ชื่อ "ข้าวหอม" 3D ถูกสร้างซ้ำสองชั้นเมื่อแตะข้ามขั้น<br>• แคปชั่น/การ์ดไกด์เด้งซ้ำสองรอบจากการค้างของ timer / delayedCall | 1. เพิ่ม Guard ใน `startNameReveal`: ตรวจสอบสถานะก่อนสร้างชื่อ 3D และยกเลิก `flowTimer` ทันทีเมื่อแตะข้ามขั้น<br>2. เพิ่ม Guard ใน `startCaption` และเก็บ instance ของ `gsap.delayedCall` ใน `name3DText.js` เพื่อสั่ง `.kill()` ทันทีเมื่อเรียก `hide()` หรือ `dispose()`<br>3. ปรับปรุง `cleanupListeners()` ให้ถอด `pointerdown` listener ออกในทุกเส้นทาง (แตะข้าม, จบเวลา, เปลี่ยน state, เปิด modal) ไม่เหลือ listener ค้าง | `src/ui/arrivalPopups.js`<br>`src/scene/name3DText.js` |
| **B** | **Viewport & Safe Area บนมือถือ**<br>• ไม่มี `viewport-fit=cover` ทำให้ `safe-area-inset` มีค่า 0 บน iPhone<br>• มี `user-scalable=no` ขัดขวางการซูมดูรูป<br>• ปุ่มด้านบนชนแถบ Dynamic Island / Notch<br>• ไม่มี fallback `100dvh` | 1. อัปเดต `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` นำ `user-scalable=no` และ `maximum-scale` ออกตามคำตอบผู้ใช้ เพื่อให้ผู้ใช้สามารถใช้สองนิ้วซูมภาพความทรงจำได้<br>2. ปรับ `.ui-zone-top-left` และ `.ui-zone-top-right` ให้ใช้ `top: max(16px, env(safe-area-inset-top))` และขอบข้าง `max(16px, env(safe-area-inset-*))`<br>3. เพิ่ม `height: 100dvh;` ให้กับ overlay, modal และ backdrop ทั้งหมด | `index.html`<br>`src/style.css` |
| **C** | **รวมตำแหน่งปุ่มมุมล่าง (Unified Bottom-Right Dock)**<br>• กฎตำแหน่งปุ่มซ้ำ 3 ที่ มี `!important` แย่งค่ากัน<br>• ปุ่ม tilt, cake message, guide pill ใช้ค่า pixel คงที่ชนกันง่าย | 1. ลบกฎ media query ที่ซ้ำซ้อนใน CSS ออกทั้งหมด<br>2. สร้าง `.bottom-right-dock` ด้วย Flexbox `column-reverse` พร้อม `gap: 10px` ผูกกับ safe area อัตโนมัติ<br>3. กำหนด CSS variable `--bottom-ui-h: 70px;` เป็นจุดอ้างอิงความสูงกลางสำหรับข้อความบนเค้กและการ์ดไกด์<br>4. ให้ปุ่ม `...` (`.mobile-tools-toggle`) ควบคุมการแสดงผลของ dock บนจอมือถืออย่างเป็นระเบียบ ไม่ทับซ้อนกัน | `src/style.css`<br>`src/core/uiDirector.js`<br>`src/ui/hudOverlay.js`<br>`src/main.js` |
| **D** | **ฉากละอองตอนถึงดาว (Arrival Particles Overhaul)**<br>• รูปเดิมแบนบนระนาบ XY โดนมุมกล้อง 72° บีบเหลือ ~31%<br>• จุดน้อย สุ่มเป็นกลุ่ม และคำว่า "ขห" สั้นไม่สื่อความหมาย | 1. **Billboard หันเข้ากล้อง**: จุดละอองคำนวณ Quaternion ตามมุมกล้องทุกเฟรม ขจัดปัญหามุมเอียง 100%<br>2. **สเกลเต็มตา**: ขยายขนาดครอบคลุม ~76% ของความกว้างจอมือถือแนวตั้ง (~46% บนเดสก์ท็อป) และสูง $\ge 25\%$ ของจอ<br>3. **แคนวาส 512x512 + ฟอนต์ไทย**: สุ่มจุดถ่วงน้ำหนักเส้นขอบตัวอักษร "ข้าวหอม" พร้อมสระ/วรรณยุกต์ครบถ้วน<br>4. **สีและประกาย**: ไล่เฉดชมพู `#f9a8d4` $\to$ ม่วงลาเวนเดอร์ `#c084fc` $\to$ ขาวสว่าง พร้อม 12% สตาร์สปาร์กเคิล<br>5. **เคลียร์เวที**: หรี่ระบบสุริยะ หัวใจ และดาวเคราะห์เหลือ 15% และซ่อนบีคอนขณะละอองรวมตัว<br>6. **ส่งต่อตรงสู่ชื่อ 3D**: กลุ่มดาวละอองหลอมเป็น "ข้าวหอม" $\to$ เปล่งประกาย $\to$ พุ่งระเบิดเข้าสู่หัวใจ แล้วเปิดชื่อ 3D "ข้าวหอม" ขนาดยักษ์ทันทีตามที่ผู้ใช้เลือก | `src/scene/solarSystemHeart.js`<br>`src/main.js`<br>`src/ui/arrivalPopups.js` |
| **E** | **Automated Visual QA & ตรวจสอบคุณภาพ**<br>• เพิ่มชุดทดสอบ Round 6 ในสคริปต์ `scripts/visual-qa.mjs`<br>• ตรวจ Rapid tap, ตรวจ UI overlap 4 ขนาดจอ, ตรวจภาพละออง | รันชุดทดสอบ `npm run visual:qa -- --phase=round6-arrival-mobile` ผ่านฉลุย 100% (Exit code 0, 0 errors, 0 warnings)<br>• Rapid Tap: สร้างชื่อ 3D เพียง 1 ชุด, แคปชั่นไม่ซ้ำ<br>• Dock Overlaps: ผ่านทุกขนาดจอ (390x844, 360x740, 844x390, 768x1024)<br>• Arrival Constellation: สว่าง ชัดเจน ไม่ตกขอบ | `scripts/visual-qa.mjs`<br>`qa/round6-arrival-mobile/` |

---

### 2. ผลการทดสอบ Visual QA อัตโนมัติ (Round 6)

| ไฟล์ภาพ QA | รายละเอียดการทดสอบ | ผลการตรวจ |
| :--- | :--- | :---: |
| `arrival-rapid-tap.png` | จำลองการแตะรัว 8 ครั้งในฉาก Arrival: มี `arrival3DNameText` ในฉากเพียง 1 ชุด, แคปชั่นไม่เบิ้ล | **ผ่าน (PASS)** |
| `dock-iphone-portrait.png` | จอ iPhone (390×844): ปุ่มใน Dock จัดเรียงแนวตั้ง ไม่ซ้อนทับกัน เว้นระยะ safe area สมบูรณ์ | **ผ่าน (PASS)** |
| `dock-android-narrow.png` | จอ Android กว้างแคบ (360×740): ปุ่มเครื่องมืออยู่ในระยะปลอดภัย ไม่ล้นจอ | **ผ่าน (PASS)** |
| `dock-mobile-landscape.png`| จอแนวนอน (844×390): Dock ขวาล่างแยกเป็นอิสระ ไม่บดบังระบบสุริยะ | **ผ่าน (PASS)** |
| `dock-tablet.png` | จอ Tablet (768×1024): แสดงผลเต็มความกว้าง touch target $\ge 44\times 44\text{px}$ ทุกปุ่ม | **ผ่าน (PASS)** |
| `cake-dock-mobile.png` | ฉากเค้กวันเกิด: ข้อความแนะนำบนเค้กกับ Dock มีระยะห่างชัดเจน ไม่ชนกัน | **ผ่าน (PASS)** |
| `arrival-constellation-portrait.png` | ฉากละอองดาวแนวตั้งมือถือ: ละอองตัวอักษร "ข้าวหอม" ขนาดใหญ่เด่นกลางจอ อ่านง่าย สวยงาม | **ผ่าน (PASS)** |
| `arrival-constellation-desktop.png` | ฉากละอองดาว Desktop: ตัวอักษรหันตั้งฉากกับสายตา ระนาบสมดุล ไร้การบิดเบี้ยว | **ผ่าน (PASS)** |

---

### 3. สิ่งที่คงไว้โดยไม่ดัดแปลง (Strict Preservation)
- ข้อความภาษาไทยดั้งเดิมทั้งหมดของเจ้าของใน `memoriesData.js`, `PLANET_CONFIG`, `secretMessage` ถูกคงไว้ตามเดิม 100%
- ไม่มีการเพิ่มฉากหรือฟีเจอร์นอกแผน
- ค่า FPS บนเครื่องจริงขึ้นอยู่กับ GPU ของโทรศัพท์ (ไม่นำค่าของ SwiftShader CPU บนเซิร์ฟเวอร์มาอ้างอิง)

---

## แผนรอบ 7: ทำชื่อ “ข้าวหอม” ให้อ่านชัด · นำทางท่องกาแล็กซี่ 3D หลังเค้ก · แก้การซ้อนทับบนมือถือ (Phases A–E)

อัปเดต: 26 ตุลาคม 2026  
สถานะ: **เสร็จสมบูรณ์ตามข้อกำหนดทุกข้อ, ผ่านการตรวจ Automated Visual QA (Round 7) รหัสผ่าน 100%, ตรวจสอบภาพจริงครบถ้วน, และพร้อม Deploy ขึ้น Production บน Vercel**

---

### 1. รายละเอียดการแก้ไขในแต่ละเฟส (Phases A–E)

| เฟส | ปัญหาเดิมและขอบเขตงาน | แนวทางแก้ไขและผลลัพธ์ | ไฟล์ที่แก้ไข |
| :---: | :--- | :--- | :--- |
| **A** | **การอ่านคำ “ข้าวหอม” หลังเดินทาง**<br>• อนุภาคกระจาย ไม่เป็นตัวอักษรชัดเจน<br>• ดาวเคราะห์, วงโคจร และหัวใจคริสตัลแย่งสายตาด้านหลังคำ<br>• สระและวรรณยุกต์ ( ้, า ) อาจขาดตอน | 1. **แคนวาสความละเอียดสูง 800×280**: เรนเดอร์ตัวอักษร "ข้าวหอม" ขนาด 144px ด้วยฟอนต์ไทย `Prompt` พร้อมรอ `document.fonts.ready` และมี robust bold sans-serif fallback<br>2. **Strided Sampling 65% เนื้อ / 35% ขอบ**: สุ่มตำแหน่งแบบเกลี่ยสม่ำเสมอทั่วทุกสโตรก ขจัดปัญหาอนุภาคจับตัวเป็นก้อนหรือแหว่ง<br>3. **เคลียร์เวทีสมบูรณ์**: สั่งซ่อน `heartGroup`, `orbitPathMaterials` (วงโคจร), `planetsList` และบีคอน ทั้งหมดระหว่างแสดงคำ เพื่อให้คำลอยเด่นบนอวกาศอย่างสง่างาม<br>4. **Billboard หน้าเลนส์**: ปรับองศาตามกล้อง พร้อมคำนวณสเกลครอบคลุม 82% ของจอมือถือแนวตั้ง และ 50% บนเดสก์ท็อป<br>5. **ระยะเวลาค้างคำ**: ค้างให้อ่านชัดเจน 2.5 วินาที พร้อมประกายวิบวับเบาๆ ก่อนยุบตัวพุ่งเข้าจุดศูนย์กลางเพื่อเปิดหัวใจคริสตัล<br>6. **คืนค่าความปลอดภัย**: มี `cancelArrivalEffect()` คืนสถานะ `visible = true` และ opacity ปกติทุกเส้นทาง | `src/scene/solarSystemHeart.js`<br>`src/main.js` |
| **B** | **ปรับดาวฉากหลังให้สวยและไม่แย่งคำ**<br>• ประกายดาวเพชรและดาวตกฉากหลังอาจแย่งความสนใจขณะอ่านคำ | 1. **Arrival Mode ใน Skybox**: เพิ่ม Uniform `uArrivalDim` ใน Shader ของดาวเพชร โดยหรี่แสงลง 75% (`uArrivalDim = 0.25`) เฉพาะช่วงแสดงคำ "ข้าวหอม"<br>2. **พักดาวตกชั่วคราว**: หยุด Ambient meteors, Fireball และ Clusters ชั่วคราวไม่ให้วิ่งพาดผ่านตัวอักษร<br>3. **คืนค่าปกติอัตโนมัติ**: เมื่อจบฉากหรือแตะข้าม จะเรียก `galaxy.setArrivalMode(false)` คืนความสว่างสดใสของกาแล็กซีทันที | `src/scene/galaxySkybox.js`<br>`src/main.js` |
| **C** | **แนะนำปุ่มกาแล็กซี่หลังเป่าเค้ก**<br>• หลังเป่าเค้กและเข้าสู่ฉาก Epilogue ผู้ใช้อาจไม่ทราบว่ามีมุมมองกาแล็กซี่ 3D ให้ชมต่อ | 1. **Spotlight ชี้ปุ่มจริง**: แสดงวงไฟ Spotlight ส่องตรงไปยังปุ่ม `#btn-toggle-galaxy` ที่มุมขวาบนจริง พร้อมการ์ดแนะนำสีทองเปล่งประกาย<br>2. **ข้อความตรงตามอุปกรณ์**:<br>• Desktop: *“ชมเค้กเสร็จแล้ว ลองกด “ท่องกาแล็กซี่ 3D” 🌌 เพื่อดูจักรวาลมุมกว้างของข้าวหอม”*<br>• Mobile: *“ชมเค้กเสร็จแล้ว ลองกดปุ่ม 🌌 ด้านบน เพื่อดูจักรวาลมุมกว้างของข้าวหอม”*<br>3. **ระบบ Dismiss สมบูรณ์**: การ์ดและ Spotlight จะหายไปทันทีเมื่อผู้ใช้กดปุ่ม `#btn-toggle-galaxy`, กดปุ่ม ✕, กด Escape, หรือเปลี่ยนฉาก<br>4. **สถานะปุ่มสลับถูกต้อง**: เมื่อกดเข้า Galaxy view ปุ่มจะเปลี่ยนเป็น "ดวงใจสุริยะ" (💖) และเมื่อกดอีกครั้งจะบินกลับสู่ระบบสุริยะหัวใจวันเกิดอย่างราบรื่น | `src/config/guideCopy.js`<br>`src/ui/guideDirector.js`<br>`src/ui/hudOverlay.js`<br>`src/style.css` |
| **D** | **แก้ UI ซ้อนบนมือถือและ Touch Target**<br>• Coach bubble ในฉากเค้กทับปุ่ม `เป่าเทียน` / `ใช้ไมค์เป่า` บนมือถือ<br>• Action panel ฉาก Epilogue ชนกับ Dock<br>• Touch target ปุ่มไอคอนบนมือถืออาจเล็กกว่า 44px | 1. **Cake Coach Float Clearance**: จัดตำแหน่ง `.guide-bubble-cake` ให้ลอยอยู่กึ่งกลางที่ `bottom: calc(max(20px, env(safe-area-inset-bottom)) + 66px)` เว้นระยะห่างเหนือปุ่มเป่าเทียน 20px พ้นรัศมีปุ่ม 100%<br>2. **แยกโซน Epilogue ชัดเจน**: ย้าย `.ui-epilogue-actions` ไปไว้ที่ `bottom-left` (ล่างซ้าย) ส่วนปุ่มเครื่องมือ `...` อยู่ที่ `bottom-right` (ล่างขวา) และคำแนะนำกาแล็กซี่อยู่ที่ `top-right` (บนขวา) ไร้การทับซ้อน 0%<br>3. **Touch Target $\ge 44\times 44\text{px}$**: บังคับ `min-width: 44px; min-height: 44px;` สำหรับ `.hud-icon-btn` และ `#btn-toggle-galaxy` บนทุกขนาดหน้าจอ | `src/style.css`<br>`src/ui/guideDirector.js`<br>`src/main.js` |
| **E** | **Automated Visual QA Round 7 & ตรวจภาพจริง**<br>• เก็บภาพทั้ง 8 ใบและตรวจเช็คเชิงเรขาคณิต (Bounding Rects) | รันชุดทดสอบ `npm run visual:qa -- --phase=round7-arrival-galaxy` ผ่านฉลุย 100% (Exit code 0, 0 errors)<br>• ตรวจสอบภาพจริงด้วยตาครบทั้ง 8 ใบ: ตัวอักษร "ข้าวหอม" คมชัดสมบูรณ์, เค้กไม่ทับปุ่ม, Spotlight ชี้ปุ่มกาแล็กซี่แม่นยำ, การสลับมุมมองลื่นไหล | `scripts/visual-qa.mjs`<br>`qa/round7-arrival-galaxy/` |

---

### 2. ผลการตรวจสอบภาพ Visual QA จริงทั้ง 8 ใบ (Round 7)

| ไฟล์ภาพ QA | รายละเอียดการทดสอบ | ผลการตรวจ |
| :--- | :--- | :---: |
| `arrival-word-desktop.png` | Desktop (1440×900): กลุ่มละอองดาว 2,600 จุดหลอมรวมเป็นคำว่า **"ข้าวหอม"** กลางจออย่างชัดเจน ไม่มีหัวใจ/ดาวเคราะห์/วงโคจรแย่งสายตา | **ผ่าน (PASS)** |
| `arrival-word-portrait.png` | Mobile Portrait (390×844): คำว่า **"ข้าวหอม"** วางตัวสมดุล กว้าง 82% ของจอ สระ/วรรณยุกต์ครบถ้วน ไม่บิดเบี้ยวหรือตกขอบ | **ผ่าน (PASS)** |
| `arrival-word-reduced-motion.png` | Reduced Motion: แสดงคำว่า "ข้าวหอม" ครบถ้วนทันทีโดยไม่ต้องรอทรานซิชันยาว | **ผ่าน (PASS)** |
| `cake-actions-mobile.png` | ฉากเค้กวันเกิดบนมือถือ: Coach bubble ลอยอยู่เหนือปุ่ม "เป่าเทียน 🎂" และ "ใช้ไมค์เป่า" ด้วยระยะ clearance 20px ไม่มีจุดซ้อนทับ | **ผ่าน (PASS)** |
| `epilogue-galaxy-prompt-desktop.png` | Epilogue บน Desktop: Spotlight ส่องปุ่ม `#btn-toggle-galaxy` จริง พร้อมการ์ดสีทองชวนกด "ท่องกาแล็กซี่ 3D" แยกโซนกับปุ่มล่างซ้าย | **ผ่าน (PASS)** |
| `epilogue-galaxy-prompt-mobile.png` | Epilogue บน Mobile: ส่องปุ่มไอคอน 🌌 ชัดเจน, touch target 44×44px, ปุ่ม ⋯ อยู่ขวาล่าง, แอ็กชันอยู่ซ้ายล่าง ไม่ชนกัน | **ผ่าน (PASS)** |
| `epilogue-galaxy-active.png` | หลังกดปุ่ม: เข้าสู่มุมมอง 3D Milky Way กาแล็กซี่มุมกว้าง, ชื่อ 3D สีชมพูทองปรากฏ, ปุ่มเปลี่ยนสถานะเป็น "ดวงใจสุริยะ" (💖) | **ผ่าน (PASS)** |
| `epilogue-return-to-heart.png` | หลังกดอีกครั้ง: บินกลับสู่ศูนย์กลางหัวใจวันเกิดอย่างนุ่มนวล ปุ่มกลับเป็นไอคอน 🌌 พร้อมใช้งาน | **ผ่าน (PASS)** |

---

### 3. สถานะการ Deploy บน Production (Vercel)

- **Production URL**: https://birthday-pi-wheat.vercel.app
- **Production Asset Bundle**: `dist/assets/index-CpQHV152.js` และ `dist/assets/index-D3Ma7g6Z.css`
- **Build Status**: `npm run build` ผ่านสมบูรณ์ (Zero errors, built in ~700ms)

---

## แผนรอบ 8: ออกแบบการเดินทางใหม่ “ประตูดาวลูกหมู — Star Gate Arrival” · ซ่อนระบบสุริยะระหว่างทาง · ทำภาพให้คมชัด (Phases A–E)

อัปเดต: 26 ตุลาคม 2026  
สถานะ: **เสร็จสมบูรณ์ตามข้อกำหนดทุกข้อ, ผ่านการตรวจ Automated Visual QA (Round 8) ครบทั้ง 14 การทดสอบ (100% PASS, 0 Leaked Objects), ตรวจสอบภาพจริงครบถ้วนด้วยตา, และพร้อม Deploy ขึ้น Production บน Vercel**

---

### 1. รายละเอียดการแก้ไขในแต่ละเฟส (Phases A–E)

| เฟส | ปัญหาเดิมและขอบเขตงาน | แนวทางแก้ไขและผลลัพธ์ | ไฟล์ที่แก้ไข |
| :---: | :--- | :--- | :--- |
| **A** | **ซ่อนระบบสุริยะระหว่างการเดินทางอย่างสมบูรณ์**<br>• เดิมเห็นหัวใจ, ดาวเคราะห์ 5 ดวง, ป้ายชื่อ และเส้นวงโคจรลอยอยู่กลางอุโมงค์ขณะเดินทาง<br>• ไม่มี State จัดการ Transit Mode แบบรวมศูนย์ | 1. **สร้างระบบ Transit Mode (`solarSystem.setTransitMode(true/false)`)**: ซ่อน `rootGroup`, `heartGroup`, `planetsList`, เส้นทางวงโคจร, ป้ายชื่อดาว, บีคอน และ Pointer trails ทั้งหมด พร้อมปิดการ Hover และ Raycasting ของดาวเคราะห์ตลอดการเดินทาง<br>2. **กักกันวัตถุใน Scene**: ตั้งค่าเริ่มต้นให้ `heartAnamorphicHorizontalStreak` และ `VerticalStreak` ซ่อนตัว (`visible = false`) เพื่อให้ Scene สะอาด 100%<br>3. **รวมศูนย์ Cleanup ทางเดียว (`finishFlight`)**: ทำงานครั้งเดียวรองรับทั้งการบินจบตามธรรมชาติ, การกดปุ่มข้าม (Skip), โหมด Reduced Motion, `?fx=off` และการสลับหน้าจอ ป้องกัน Timer หรือ Tween ซ้ำซ้อน | `src/scene/solarSystemHeart.js`<br>`src/scene/pointerStarTrail.js`<br>`src/main.js` |
| **B** | **สร้างฉาก “Star Gate Arrival” ใหม่**<br>• เอฟเฟกต์วาร์ปเดิมมีวงแหวนขนาดใหญ่และอนุภาคหนาแน่นทับซ้อนกลางจอ<br>• เวลาเดินทางยาวนานผิดปกติเพราะถูกหน่วงด้วย `timeScale(0.55)` | 1. **ดีไซน์ประตูดาวลูกหมู (Star Gate)**: วงแหวนทวินสีโรสโกลด์/มาเจนตา และสีทองเรืองรอง พร้อม 8 Starlight Nodes และ Iris ตรงกลางที่ค่อยๆ เปิดออก<br>2. **Peripheral Speed Streaks**: เส้นแสงความเร็วพุ่งจากขอบประตูสู่ขอบจอ (รัศมี 19 ถึง 68) เว้นพื้นที่ตรงกลางให้โปร่ง สะอาด และมองเห็นอวกาศลึกชัดเจน<br>3. **ความเร็วธรรมชาติ 7.8 วินาที**: ปลดล็อก `timeScale(0.55)` ออก และใช้ GSAP Easing ธรรมชาติ 7.8s (สอดคล้องกับเป้าหมาย 7–9 วินาที)<br>4. **ลำดับการเปิดเผยระบบสุริยะ (Arrival Reveal)**: ชะลอความเร็วเข้าสู่ความมืดคม → ละอองดาวเปล่งแสงวาดคำว่า **“ข้าวหอม”** ค้างให้อ่านชัดเจน $\ge 2.0$ วินาที → ละอองคำยุบตัวพุ่งเข้าสู่จุดศูนย์กลาง `(0, 0, 0)` → หัวใจคริสตัลระเบิดแสงเปิดตัว → วงโคจรและดาวเคราะห์ทั้ง 5 สว่างขึ้นตามลำดับ | `src/scene/starGate.js`<br>`src/scene/wormhole.js`<br>`src/main.js` |
| **C** | **ขจัดความเบลอ ปรับภาพและตัวอักษรให้คมชัดกริบ**<br>• ภาพรวมและตัวอักษรไทยดูนุ่ม มีขอบสีแดง/ฟ้า (Chromatic Aberration) และฟิล์มเกรนที่แรงเกินไป<br>• Overlay ของ Intro มี `backdrop-filter: blur(5px)` บังทับ WebGL Canvas | 1. **Chromatic Aberration เป็นศูนย์ (`uCA = 0.0`)**: ปิดการแยกขอบสีใน `cinematicPass` ขจัดขอบสีแดง/ฟ้า รอบตัวอักษรไทยและดวงดาวทุกดวงโดยสิ้นเชิง<br>2. **ลด Film Grain สู่ระดับ Micro (`uGrain = 0.003`)**: ลดสัญญาณรบกวนให้ภาพสะอาด เนียนตา และคมชัดทุกพิกเซล<br>3. **ปิด BokehPass ตลอดเส้นทางหลัก**: ยืนยัน `bokehPass.enabled = false` ในช่วง Intro, Flight, Arrival, Explore และ Cake คงความคมชัดแบบ Tack-sharp<br>4. **ถอด Backdrop Blur จากหน้า Intro**: ลบ `backdrop-filter: blur(5px)` ออกจาก `.intro-screen-overlay` เพื่อให้ดวงดาวและประตูดาวลูกหมูหลังหน้าต่างข้อความคมชัดเต็มความละเอียด | `src/main.js`<br>`src/style.css` |
| **D** | **ปรับปรุง UX Guide และ Flow**<br>• กล่องคำแนะนำเดิมระหว่างเดินทางอาจเกะกะและชวนให้เข้าใจผิดว่าเป็นจุดที่ต้องคลิก | 1. **Toast คำแนะนำแบบ Non-blocking**: แสดงข้อความ `กำลังเดินทาง… แตะข้ามได้ทุกเมื่อ 🚀` ด้วย CSS Class `.flight-toast-hud` ที่มี `pointer-events: none` หายไปเองใน 4 วินาที ไม่บดบังปุ่มข้ามและฉากหลัง<br>2. **ปุ่มข้ามฉากเดินทางปลอดภัย (`#btn-skip-flight`)**: แสดงตลอดช่วง Flight มี Touch Target ขั้นต่ำ $44\times 44\text{px}$ พร้อม Safe Area Padding สำหรับหน้าจอมือถือที่มีติ่งหรือขอบโค้ง<br>3. **ล้าง Timers อัตโนมัติใน `guideDirector.js`**: ฟังก์ชัน `clearAllGuides()` เคลียร์ทั้ง `idleTimer1`, `idleTimer2`, `idleTimer3` ป้องกันไกด์ขึ้นซ้อนทับเมื่อกดข้ามหรือสลับหน้าจอ | `src/ui/guideDirector.js`<br>`src/style.css`<br>`src/main.js` |
| **E** | **Automated Visual QA Round 8 (14 ภาพ) & Scene Audit**<br>• ตรวจสอบการรั่วไหลของวัตถุระบบสุริยะและการเรนเดอร์ในทุกขนาดจอ | 1. **Scene Audit กวดขัน 100%**: ตรวจสอบผ่าน `window.__qaSceneAudit()` ระหว่างเดินทาง ยืนยันว่า **Zero Solar System Objects** (0 รายการ) หลุดรอดเข้ามาใน Scene<br>2. **บันทึกภาพทดสอบจริงครบ 14 ใบ**: ครอบคลุมทั้ง Desktop, Portrait, Landscape, Reduced Motion, FX-off, Flight Skip และ Sharpness Focus | `scripts/visual-qa.mjs`<br>`qa/round8-star-gate/` |

---

### 2. ผลการตรวจสอบภาพ Visual QA จริงทั้ง 14 ใบ (Round 8)

| ลำดับ | ไฟล์ภาพ QA | Viewport / สถานะ | ผลการตรวจ Scene Audit และความคมชัด | สถานะ |
| :---: | :--- | :--- | :--- | :---: |
| 1 | `intro-clean-desktop.png` | 1280×720 (Desktop) | วงแหวนประตู Star Gate สองชั้นสีโรสโกลด์/ทอง โดดเด่นกลางอวกาศม่วงลึก ปราศจากดาวเคราะห์และหัวใจ (0 leaked objects) | **ผ่าน (PASS)** |
| 2 | `intro-clean-portrait.png` | 390×844 (Mobile) | ประตูวางตัวกึ่งกลางพอดี ดาวพื้นหลังระยิบระยับคมชัด ปราศจากระบบสุริยะ (0 leaked objects) | **ผ่าน (PASS)** |
| 3 | `flight-start-desktop.png` | 1280×720 (Desktop) | จุดเริ่มต้นการบิน: ประตูขยายออก เส้นสปีดขอบจอเริ่มพุ่ง ตรงกลางโปร่งสะอาด (0 leaked objects) | **ผ่าน (PASS)** |
| 4 | `flight-mid-desktop.png` | 1280×720 (Desktop) | กึ่งกลางการเดินทาง: อุโมงค์มิติสีม่วงเข้ม เส้นแสงพุ่งรอบนอก ตรงกลางโล่งสะอาด ไร้หัวใจ/ดาวเคราะห์/วงโคจร 100% | **ผ่าน (PASS)** |
| 5 | `flight-end-desktop.png` | 1280×720 (Desktop) | ท้ายการเดินทาง: ชะลอความเร็วเข้าสู่ความมืดคมเพื่อเตรียมเปิดตัวอักษร (0 leaked objects) | **ผ่าน (PASS)** |
| 6 | `flight-mid-portrait.png` | 390×844 (Mobile) | กึ่งกลางการเดินทางบนมือถือแนวตั้ง: ประตูและเส้นความเร็วสเกลสมบูรณ์ พื้นที่กลางจอสะอาดหมดจด | **ผ่าน (PASS)** |
| 7 | `flight-mid-landscape.png`| 844×390 (Landscape)| กึ่งกลางการเดินทางบนมือถือแนวนอน: ปรับมุมมองกว้างสวยงาม ไร้สิ่งแปลกปลอม | **ผ่าน (PASS)** |
| 8 | `arrival-reveal-desktop.png`| 1280×720 (Desktop) | กลุ่มละอองดาวระยิบระยับเรียงตัวเป็นคำว่า **“ข้าวหอม”** ชัดเจน ลอยเด่นกลางความมืด ก่อนยุบตัวเปิดหัวใจ | **ผ่าน (PASS)** |
| 9 | `arrival-reveal-portrait.png`| 390×844 (Mobile) | ตัวอักษร “ข้าวหอม” อ่านง่าย สระและวรรณยุกต์ครบถ้วน สมดุลกลางจอมือถือ | **ผ่าน (PASS)** |
| 10 | `flight-skip.png` | 1280×720 (Desktop) | ผลหลังกดปุ่ม "ข้ามฉากเดินทาง ⏩": เข้าสู่สถานะ EXPLORE อย่างถูกต้อง คืนระบบสุริยะครบ 5 ดวงพร้อมหัวใจ ไร้ Tween ค้าง | **ผ่าน (PASS)** |
| 11 | `reduced-motion-reveal.png` | 1280×720 (Reduced Motion)| ปิดการหมุนกล้องความเร็วสูง แสดงการเปิดตัวอักษรอย่างนุ่มนวลและปลอดภัยต่อสายตา | **ผ่าน (PASS)** |
| 12 | `fx-off-reveal.png` | 1280×720 (`?fx=off`) | โหมดประหยัดทรัพยากร: ข้ามเอฟเฟกต์หนัก เข้าสู่ระบบสุริยะได้อย่างสมบูรณ์แบบ | **ผ่าน (PASS)** |
| 13 | `sharpness-focus-desktop.png`| 1280×720 (Desktop) | ตรวจสอบความคมชัด: พื้นผิวโลก, ทวีป, เมฆ, หัวใจคริสตัล, ข้อความภาษาไทย และปุ่ม UI คมกริบ ไร้ขอบสี Chromatic Aberration | **ผ่าน (PASS)** |
| 14 | `sharpness-focus-mobile.png` | 390×844 (Mobile) | ความคมชัดบนมือถือ: ข้อความไกด์, ตัวเลขนับดาว 16 ปี, ปุ่มปิดทัวร์ คมชัด ไร้รอยเบลอ | **ผ่าน (PASS)** |

---

### 3. สถานะการ Deploy บน Production (Vercel)

- **Production URL**: https://birthday-pi-wheat.vercel.app
- **Production Asset Bundle**: `dist/assets/index-C6pUcSFJ.js` และ `dist/assets/index-CDWl2Kn4.css`
- **Build Status**: `npm run build` ผ่านสมบูรณ์ (Zero errors, built in ~800ms)
