import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Car,
  Wrench,
  ShieldAlert,
  HelpCircle,
  RotateCcw,
  User,
} from 'lucide-react';
import { Vehicle } from '../types/vehicle';
import { formatKm, formatDateVN } from '../utils/formatters';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface CopilotViewProps {
  vehicle: Vehicle;
}

export const CopilotView: React.FC<CopilotViewProps> = ({ vehicle }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Xin chào! Tôi là **Aufix Copilot** - Trợ lý buồng lái thông minh hỗ trợ xe **${vehicle.name} (${vehicle.plateNumber})**.\n\nTôi đang theo dõi:\n- **ODO hiện tại**: ${formatKm(vehicle.currentOdo)}\n- **Hạn đăng kiểm**: ${formatDateVN(vehicle.inspectionExpiry)}\n- **Hạn bảo hiểm**: ${formatDateVN(vehicle.insuranceExpiry)}\n\nBạn có thể hỏi tôi về lịch bảo dưỡng định kỳ, giải thích đèn báo taplo, thủ tục đăng kiểm hay quy trình bồi thường bảo hiểm!`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickQuestions = [
    `Xe ${vehicle.model} đi được ${formatKm(vehicle.currentOdo)}, cần bảo dưỡng những hạng mục nào?`,
    'Đăng kiểm quá hạn bị phạt bao nhiêu tiền và cách đặt lịch đăng kiểm online?',
    'Khi va chạm xe, các bước cần làm để gọi bảo hiểm giải quyết bồi thường?',
    'Đèn báo lỗi cá vàng (Check Engine) sáng trên taplo thì xử lý ra sao?',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          vehicleContext: {
            name: vehicle.name,
            plateNumber: vehicle.plateNumber,
            type: vehicle.type,
            brand: vehicle.brand,
            model: vehicle.model,
            currentOdo: vehicle.currentOdo,
            inspectionExpiry: vehicle.inspectionExpiry,
            insuranceExpiry: vehicle.insuranceExpiry,
            insurerName: vehicle.insurerName,
            nextServiceOdo: vehicle.nextServiceOdo,
          },
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi kết nối Copilot');
      }

      const data = await response.json();
      const botMsg: Message = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: data.reply || 'Aufix Copilot chưa có thông tin phản hồi.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.warn('Copilot error:', err);
      const errorMsg: Message = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content:
          'Aufix Copilot đang ngoại tuyến hoặc kết nối mạng bị gián đoạn. Bạn vẫn có thể tham khảo sổ tay bảo dưỡng và giấy tờ trong ứng dụng.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Aufix AI Copilot</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400/40 text-cyan-300">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Trợ lý chuyên gia kỹ thuật xe & cố vấn giao thông đường bộ Việt Nam
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'welcome-reset',
                role: 'assistant',
                content: `Cuộc trò chuyện đã được làm mới. Bạn cần hỗ trợ gì về chiếc xe **${vehicle.name} (${vehicle.plateNumber})**?`,
                timestamp: new Date().toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ])
          }
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
          title="Xóa lịch sử chat"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="h-[480px] rounded-2xl border border-slate-800 bg-slate-950/80 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap space-y-2">{m.content}</div>
              <div
                className={`text-[9px] mt-1.5 text-right ${
                  m.role === 'user' ? 'text-cyan-100/70' : 'text-slate-500'
                }`}
              >
                {m.timestamp}
              </div>
            </div>

            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-cyan-300 font-mono text-[11px] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Aufix Copilot đang phân tích câu hỏi...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] text-slate-400 font-medium">Gợi ý câu hỏi nhanh:</span>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] text-left px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Hỏi Aufix Copilot về xe ${vehicle.model}, lỗi taplo, đăng kiểm, phụ tùng...`}
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-xs text-white focus:outline-none placeholder-slate-500 shadow-inner"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Gửi</span>
        </button>
      </form>
    </div>
  );
};
