/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Copy, Check, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);

  // Inject the banner ad script
  useEffect(() => {
    if (adContainerRef.current && !adContainerRef.current.innerHTML) {
      const script1 = document.createElement('script');
      script1.type = 'text/javascript';
      script1.innerHTML = `
        atOptions = {
          'key' : '9de24d4b2dbecfd3c68f3f84fb3a0bad',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      
      const script2 = document.createElement('script');
      script2.src = 'https://www.highperformanceformat.com/9de24d4b2dbecfd3c68f3f84fb3a0bad/invoke.js';
      script2.async = true;

      adContainerRef.current.appendChild(script1);
      adContainerRef.current.appendChild(script2);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setImage(base64Data);
      extractTextFromImage(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const extractTextFromImage = async (base64Image: string) => {
    setIsProcessing(true);
    setExtractedText('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = "gemini-3-flash-preview";
      
      const base64Content = base64Image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: model,
        contents: [
          {
            parts: [
              { text: "Extract all text from this image exactly as it appears. If there is no text, say 'No text found in this image.'" },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Content,
                },
              },
            ],
          },
        ],
      });

      const text = response.text || 'No text found.';
      setExtractedText(text);
    } catch (err) {
      console.error(err);
      setError('Failed to extract text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const reset = () => {
    setImage(null);
    setExtractedText('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#141414] font-sans selection:bg-[#141414] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#141414]/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#141414] rounded-lg flex items-center justify-center">
              <ImageIcon className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">OCR Quick Copy</h1>
          </div>
          <div className="text-xs font-mono opacity-50 uppercase tracking-widest">Powered by Gemini AI</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Banner Ad Section */}
        <section className="flex justify-center">
          <div 
            ref={adContainerRef} 
            className="w-[728px] h-[90px] bg-white/50 border border-dashed border-[#141414]/20 rounded-lg flex items-center justify-center overflow-hidden"
            id="banner-ad-container"
          >
            {/* Ad will be injected here */}
          </div>
        </section>

        {/* Upload Section */}
        <section>
          <AnimatePresence mode="wait">
            {!image ? (
              <motion.div
                key="upload-box"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) processFile(file);
                }}
                className="group relative cursor-pointer"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-[#141414] to-[#444] rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                <div className="relative border-2 border-dashed border-[#141414]/20 rounded-2xl p-12 bg-white flex flex-col items-center justify-center gap-4 transition-all hover:border-[#141414]/40 hover:bg-[#F9F9F9]">
                  <div className="w-16 h-16 bg-[#F5F5F4] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 opacity-40" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium">Click or drag image to upload</p>
                    <p className="text-sm opacity-50">Supports PNG, JPG, WEBP</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid md:grid-columns-2 gap-8"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
              >
                {/* Image Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 italic serif">Source Image</h2>
                    <button 
                      onClick={reset}
                      className="p-2 hover:bg-white rounded-full transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden border border-[#141414]/10 bg-white">
                    <img 
                      src={image} 
                      alt="Uploaded" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Extracted Text */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 italic serif">Extracted Text</h2>
                    {extractedText && (
                      <button
                        onClick={copyToClipboard}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isCopied 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-[#141414] text-white hover:bg-[#333]'
                        }`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {isCopied ? 'Copied!' : 'Copy Text'}
                      </button>
                    )}
                  </div>
                  <div className="relative min-h-[200px] rounded-xl border border-[#141414]/10 bg-white p-6 font-mono text-sm leading-relaxed overflow-auto max-h-[400px]">
                    {isProcessing ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 animate-spin opacity-40" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-50">Analyzing image...</p>
                      </div>
                    ) : extractedText ? (
                      <div className="whitespace-pre-wrap">{extractedText}</div>
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-30 italic">
                        No text extracted yet.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Footer Info */}
        <footer className="pt-12 border-t border-[#141414]/5 text-center space-y-4">
          <p className="text-xs opacity-40 max-w-md mx-auto">
            This tool uses advanced AI to recognize text in images. Accuracy may vary depending on image quality and font style.
          </p>
        </footer>
      </main>
    </div>
  );
}
