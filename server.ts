import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High body limit to accept high-res photos taken from phone cameras
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side GoogleGenAI initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * API: Scan Document & Auto-Extract Vehicle Information
 * Supports:
 * - Cà vẹt xe / Giấy đăng ký xe máy, ô tô
 * - Sổ / Giấy chứng nhận kiểm định đăng kiểm xe
 * - Giấy chứng nhận bảo hiểm TNDS & Thân vỏ
 * - Phiếu bảo dưỡng / sửa chữa / thay thế phụ tùng gara
 * - Hóa đơn đổ xăng / nhiên liệu
 */
app.post('/api/scan-document', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', documentTypeHint } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 parameter' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống.',
      });
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const systemPrompt = `Bạn là hệ thống AI chuyên gia nhận diện và bóc tách dữ liệu giấy tờ giao thông và hóa đơn bảo dưỡng xe tại Việt Nam (Veo App OCR Engine).
Nhiệm vụ của bạn là đọc ảnh tài liệu xe và phân tích chính xác tuyệt đối các trường thông tin:
1. Xác định loại tài liệu (documentType):
   - "REGISTRATION": Cà vẹt xe / Giấy chứng nhận đăng ký xe ô tô, xe máy, mô tô
   - "INSPECTION": Giấy chứng nhận kiểm định an toàn kỹ thuật và bảo vệ môi trường (Sổ đăng kiểm xe cơ giới)
   - "INSURANCE": Giấy chứng nhận bảo hiểm bắt buộc TNDS hoặc bảo hiểm vật chất / thân vỏ xe
   - "MAINTENANCE": Phiếu tiếp nhận bảo dưỡng, hóa đơn sửa chữa, phiếu thay dầu nhớt, biên bản phụ tùng gara
   - "FUEL": Hóa đơn bán lẻ đổ xăng dầu
   - "OTHER": Giấy tờ liên quan khác

2. Bóc tách các trường chi tiết theo chuẩn Việt Nam:
   - Biển kiểm soát / Biển số xe: Định dạng chuẩn Việt Nam (vd: 30F-123.45, 51K-888.88, 29B1-234.56, ...)
   - Tên chủ xe, Địa chỉ
   - Nhãn hiệu xe (Honda, Toyota, Mazda, Hyundai, VinFast, Yamaha, Kia, Ford, Mercedes, BMW, ...)
   - Số loại / Dòng xe (CX-5, Accent, Morning, Vios, City, VF8, VF3, SH150, Air Blade, ...)
   - Số khung (VIN), Số máy
   - Năm sản xuất, Ngày đăng ký đầu tiên / Ngày cấp
   - Hạn đăng kiểm (rất quan trọng, ngày tháng năm hết hạn đăng kiểm)
   - Đơn vị đăng kiểm / Trạm kiểm định
   - Hạn bảo hiểm (ngày bắt đầu, ngày hết hạn bảo hiểm)
   - Đơn vị bảo hiểm (Bảo Việt, PVI, PTI, MIC, BIC, PJICO, VBI, VietinBank...)
   - Loại bảo hiểm: "TNDS Bắt buộc", "Bảo hiểm Thân vỏ / Tự nguyện", "Toàn diện"
   - Gara bảo dưỡng / Sửa chữa: Tên gara/trung tâm dịch vụ
   - Ngày bảo dưỡng, Số km công-tơ-mét (ODO) tại thời điểm bảo dưỡng
   - Hạng mục bảo dưỡng (danh sách: tên phụ tùng/công việc, số lượng, đơn giá, thành tiền)
   - Tổng chi phí thanh toán (số nguyên VND)
   - Ngày hoặc số ODO khuyến nghị bảo dưỡng tiếp theo

3. Đưa ra tóm tắt ngắn gọn và khuyến nghị thông minh (recommendation) cho chủ xe (ví dụ: "Cảnh báo: Đăng kiểm sẽ hết hạn trong 20 ngày nữa", "Khuyến nghị: Bảo dưỡng cấp tiếp theo ở mốc 45.000 km").`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg',
              },
            },
            {
              text: `Hãy phân tích giấy tờ xe này và bóc tách toàn bộ thông tin chi tiết dạng JSON chuẩn. Gợi ý loại giấy tờ nếu có: ${documentTypeHint || 'tự động nhận diện'}.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: {
              type: Type.STRING,
              description: 'REGISTRATION | INSPECTION | INSURANCE | MAINTENANCE | FUEL | OTHER',
            },
            documentTitle: {
              type: Type.STRING,
              description: 'Tên hiển thị tiếng Việt của giấy tờ (VD: Đăng ký xe Mazda CX-5, Giấy kiểm định xe 30F-12345)',
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: 'Độ tin cậy từ 0.0 đến 1.0',
            },
            extractedFields: {
              type: Type.OBJECT,
              properties: {
                plateNumber: { type: Type.STRING, description: 'Biển số xe' },
                ownerName: { type: Type.STRING, description: 'Tên chủ xe' },
                ownerAddress: { type: Type.STRING, description: 'Địa chỉ chủ xe' },
                brand: { type: Type.STRING, description: 'Nhãn hiệu (Toyota, Honda, Mazda...)' },
                model: { type: Type.STRING, description: 'Số loại / Dòng xe (Vios, CX-5, VF8...)' },
                color: { type: Type.STRING, description: 'Màu sơn' },
                chassisNumber: { type: Type.STRING, description: 'Số khung (VIN)' },
                engineNumber: { type: Type.STRING, description: 'Số máy' },
                seats: { type: Type.INTEGER, description: 'Số chỗ ngồi' },
                engineCapacity: { type: Type.STRING, description: 'Dung tích xi lanh / Động cơ' },
                firstRegistrationDate: { type: Type.STRING, description: 'Ngày đăng ký đầu tiên (YYYY-MM-DD)' },
                issueDate: { type: Type.STRING, description: 'Ngày cấp / Ngày lập phiếu (YYYY-MM-DD)' },
                expiryDate: { type: Type.STRING, description: 'Ngày hết hạn (rất quan trọng cho đăng kiểm và bảo hiểm)' },
                certificateNumber: { type: Type.STRING, description: 'Số giấy chứng nhận / Số sổ / Số seri ấn chỉ' },
                // Inspection
                inspectionStation: { type: Type.STRING, description: 'Đơn vị kiểm định (vd: Trung tâm 29-03V)' },
                inspectionPurpose: { type: Type.STRING, description: 'Kinh doanh vận tải hoặc Không kinh doanh' },
                // Insurance
                insurerName: { type: Type.STRING, description: 'Công ty bảo hiểm (PVI, Bảo Việt, PTI, MIC...)' },
                insuranceType: { type: Type.STRING, description: 'TNDS bắt buộc, Thân vỏ tự nguyện, Lái phụ xe...' },
                insuranceHotline: { type: Type.STRING, description: 'Hotline cứu hộ / bồi thường bảo hiểm' },
                insurancePremium: { type: Type.NUMBER, description: 'Phí bảo hiểm (VND)' },
                // Maintenance
                garageName: { type: Type.STRING, description: 'Tên Gara hoặc Đại lý bảo dưỡng' },
                garageAddress: { type: Type.STRING, description: 'Địa chỉ hoặc điện thoại Gara' },
                odometerKm: { type: Type.INTEGER, description: 'Số km đồng hồ công-tơ-mét (ODO)' },
                maintenanceLevel: { type: Type.STRING, description: 'Cấp bảo dưỡng (5.000km, 10.000km, đại tu...)' },
                totalAmount: { type: Type.NUMBER, description: 'Tổng chi phí thanh toán (VND)' },
                nextServiceOdo: { type: Type.INTEGER, description: 'Mốc ODO khuyến nghị bảo dưỡng tiếp theo (km)' },
                nextServiceDate: { type: Type.STRING, description: 'Ngày khuyến nghị bảo dưỡng tiếp (YYYY-MM-DD)' },
                serviceItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: 'Tên phụ tùng hoặc nội dung công việc' },
                      quantity: { type: Type.NUMBER, description: 'Số lượng' },
                      unitPrice: { type: Type.NUMBER, description: 'Đơn giá' },
                      amount: { type: Type.NUMBER, description: 'Thành tiền' },
                    },
                    required: ['name', 'amount'],
                  },
                },
                // Fuel
                fuelType: { type: Type.STRING, description: 'Loại xăng dầu (RON 95-V, E5 RON 92, Diesel...)' },
                fuelVolumeLiters: { type: Type.NUMBER, description: 'Số lít đã đổ' },
                fuelPricePerLiter: { type: Type.NUMBER, description: 'Đơn giá / lít' },
              },
            },
            summary: {
              type: Type.STRING,
              description: 'Tóm tắt nội dung văn bản bóc tách được (2-3 câu)',
            },
            recommendation: {
              type: Type.STRING,
              description: 'Khuyến nghị hữu ích cho chủ xe từ thông tin giấy tờ này',
            },
            actionType: {
              type: Type.STRING,
              description: 'Hành động đề xuất: "CREATE_VEHICLE" | "UPDATE_INSPECTION" | "UPDATE_INSURANCE" | "ADD_MAINTENANCE_LOG" | "ADD_FUEL_LOG"',
            },
          },
          required: ['documentType', 'documentTitle', 'extractedFields', 'summary'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error scanning document:', error);
    return res.status(500).json({
      error: 'Không thể nhận diện tài liệu: ' + (error?.message || 'Lỗi server'),
    });
  }
});

/**
 * API: Veo Copilot Chat & Vehicle Diagnostics
 * Trợ lý xe thông minh Gemini 3.8 Flash
 */
app.post('/api/copilot-chat', async (req, res) => {
  try {
    const { message, vehicleContext, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message parameter' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY.',
      });
    }

    const systemInstruction = `Bạn là Veo Copilot - Trợ lý buồng lái thông minh cho ô tô và xe máy tại Việt Nam (thuộc Veo App).
Phong cách của bạn: Chuyên nghiệp, nhạy bén, am hiểu sâu sắc kỹ thuật ô tô xe máy, luật giao thông đường bộ Việt Nam, bảo dưỡng định kỳ và bảo hiểm.
Trả lời bằng tiếng Việt gãy gọn, có cấu trúc bullet point rõ ràng khi tư vấn kỹ thuật hoặc cảnh báo.

Dữ liệu xe hiện tại của người dùng:
${JSON.stringify(vehicleContext || {}, null, 2)}

Hãy căn cứ vào thông tin xe thực tế của họ (số ODO, hạn đăng kiểm, hạn bảo hiểm, lịch sử bảo dưỡng) để đưa ra câu trả lời chính xác, hữu ích nhất.`;

    const contents = [
      ...history.map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      success: true,
      reply: response.text || 'Veo Copilot chưa nhận được phản hồi phù hợp.',
    });
  } catch (error: any) {
    console.error('Copilot chat error:', error);
    return res.status(500).json({
      error: 'Lỗi phản hồi Copilot: ' + (error?.message || 'Lỗi server'),
    });
  }
});

// Production and Dev serving
async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);
  const isDev = process.env.NODE_ENV !== 'production' && !hasDist;

  if (isDev) {
    // Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Veo App Pro server running on http://0.0.0.0:${PORT} in ${isDev ? 'development' : 'production'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
