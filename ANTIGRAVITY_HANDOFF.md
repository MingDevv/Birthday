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
