import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MessageCircle, Send, Image as ImageIcon, Mic, File, Search, Bot, User, Sparkles, Camera, Download, Copy, Volume2, X, Palette, FileText, FileSpreadsheet, FileImage, FileVideo, FileAudio, Archive, Code, Database, Plus, Globe, Lightbulb, Brain, PenTool, History, Trash2, VolumeX, ScanText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { enhancedWebSearch } from '@/utils/webSearch';
import { saveChatSession, getChatHistory, loadChatSession, deleteChatSession, clearChatHistory, type ChatSession } from '@/utils/chatHistory';
import { extractTextFromImage, canPerformOCR, isImageFile } from '@/utils/ocrUtils';

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: {
    type: 'image' | 'audio' | 'file';
    name: string;
    url: string;
    file?: File;
    fileType?: string;
    fileSize?: number;
  }[];
  generatedImage?: {
    url: string;
    prompt: string;
  };
  searchResults?: any;
  ocrResults?: any;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    type: 'assistant',
    content: 'Hello! I\'m AKM BOT, your advanced AI assistant developed by AKM and powered by Gemini AI. I\'m equipped with comprehensive capabilities to handle virtually any task:\n\n🎨 AI IMAGE GENERATION\n• Create stunning images from text descriptions\n• Generate artwork, designs, and visual content\n• Multiple art styles and formats supported\n\n📄 UNIVERSAL FILE ANALYSIS\n• Documents (PDF, DOC, DOCX, TXT, MD, RTF)\n• Spreadsheets (XLS, XLSX, CSV, ODS)\n• Images (JPG, PNG, GIF, SVG, WEBP, BMP)\n• Audio files (MP3, WAV, OGG, FLAC, AAC)\n• Video files (MP4, AVI, MOV, WMV, MKV)\n• Code files (JS, TS, PY, JAVA, CPP, HTML, CSS)\n• Archives (ZIP, RAR, 7Z, TAR, GZ)\n• Data files (JSON, XML, SQL, YAML, CSV)\n\n🎤 VOICE INTERACTION\n• Voice-to-text transcription\n• Natural speech processing\n• Hands-free communication\n\n🔍 INTELLIGENT SEARCH\n• Real-time information retrieval\n• Context-aware responses\n• Latest data and insights\n\n💬 ADVANCED CHAT\n• Natural language understanding\n• Context retention\n• Multi-turn conversations\n\n🗣️ TEXT-TO-SPEECH\n• AI response narration\n• Multiple voice options\n• Accessibility support\n\n💾 CHAT HISTORY\n• Save and restore conversations\n• Search through past chats\n• Export conversations\n\n📖 OCR CAPABILITIES\n• Extract text from images\n• Document digitization\n• Handwriting recognition\n\nDeveloped by AKM - Bringing you cutting-edge AI technology for all your digital needs. Upload any file, ask questions, or request image generation - I\'m here to help!',
    timestamp: new Date()
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{
    type: 'image' | 'audio' | 'file';
    name: string;
    url: string;
    file: File;
    fileType?: string;
    fileSize?: number;
  }[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isPerformingOCR, setIsPerformingOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecording = useVoiceRecording({
    onTranscriptionComplete: (text: string) => {
      console.log('Voice transcription completed:', text);
      setInputValue(text);
      toast({
        title: "Voice recorded",
        description: "Your message has been transcribed"
      });
    },
    onError: (error: string) => {
      console.error('Voice recording error:', error);
      toast({
        title: "Voice recording error",
        description: error,
        variant: "destructive"
      });
    }
  });
  const textToSpeech = useTextToSpeech();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = error => reject(error);
    });
  };
  const getFileIcon = (fileName: string, mimeType: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    // Images
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(extension || '')) {
      return <FileImage className="w-4 h-4" />;
    }

    // Audio
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension || '')) {
      return <FileAudio className="w-4 h-4" />;
    }

    // Video
    if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension || '')) {
      return <FileVideo className="w-4 h-4" />;
    }

    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension || '')) {
      return <FileText className="w-4 h-4" />;
    }

    // Spreadsheets
    if (['xls', 'xlsx', 'csv', 'ods'].includes(extension || '')) {
      return <FileSpreadsheet className="w-4 h-4" />;
    }

    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(extension || '') || ['html', 'htm', 'css', 'scss', 'sass', 'less', 'xml', 'json', 'yaml', 'yml'].includes(extension || '')) {
      return <Code className="w-4 h-4" />;
    }

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension || '')) {
      return <Archive className="w-4 h-4" />;
    }

    // Database
    if (['sql', 'db', 'sqlite', 'mdb'].includes(extension || '')) {
      return <Database className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };
  const isTextFile = (file: File): boolean => {
    const textTypes = ['text/', 'application/json', 'application/javascript', 'application/xml', 'application/xhtml+xml', 'application/sql', 'application/x-sql'];
    const textExtensions = ['.html', '.htm', '.css', '.js', '.json', '.xml', '.txt', '.md', '.csv', '.svg', '.php', '.py', '.java', '.cpp', '.c', '.h', '.ts', '.tsx', '.jsx', '.vue', '.scss', '.sass', '.less', '.yaml', '.yml', '.sql', '.sh', '.bat', '.ps1', '.rb', '.go', '.rs', '.swift', '.kt', '.dart', '.r', '.m', '.pl', '.lua', '.scala', '.clj', '.hs', '.elm', '.f', '.pas', '.asm', '.cfg', '.ini', '.conf', '.log', '.diff', '.patch'];
    return textTypes.some(type => file.type.startsWith(type)) || textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };
  const isBinaryFile = (file: File): boolean => {
    const binaryTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/octet-stream'];
    const binaryExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.db', '.sqlite'];
    return binaryTypes.some(type => file.type === type) || binaryExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };
  const analyzeFileStructure = (file: File): string => {
    const size = file.size;
    const type = file.type || 'Unknown';
    const extension = file.name.split('.').pop()?.toLowerCase() || 'none';
    const lastModified = new Date(file.lastModified);
    let sizeStr = '';
    if (size < 1024) sizeStr = `${size} bytes`;else if (size < 1024 * 1024) sizeStr = `${(size / 1024).toFixed(1)} KB`;else if (size < 1024 * 1024 * 1024) sizeStr = `${(size / 1024 / 1024).toFixed(1)} MB`;else sizeStr = `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
    return `📊 File Analysis:\n• Name: ${file.name}\n• Type: ${type}\n• Extension: .${extension}\n• Size: ${sizeStr}\n• Last Modified: ${lastModified.toLocaleString()}`;
  };
  const generateImageWithGemini = async (prompt: string) => {
    const GEMINI_API_KEY = 'AIzaSyDBMWX5dw8D2H18KG3Er8aieov_A7i2TIY';
    try {
      setIsGeneratingImage(true);
      console.log('Generating image with Gemini API, prompt:', prompt);

      // Clean and enhance the prompt for better results
      const enhancedPrompt = prompt.toLowerCase().includes('generate image') ? prompt.replace(/generate image of?/i, '').trim() : prompt;
      console.log('Enhanced prompt:', enhancedPrompt);
      const requestBody = {
        contents: [{
          parts: [{
            text: enhancedPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseModalities: ["TEXT", "IMAGE"]
        }
      };
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      // Use the correct model for image generation
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      if (!response.ok) {
        let errorMessage = `Gemini API Error (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          console.log('Error data:', errorData);
          errorMessage = errorData.error?.message || errorData.error?.code || 'Unknown error';
        } catch (e) {
          console.log('Could not parse error response');
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        throw new Error(errorMessage);
      }
      const data = JSON.parse(responseText);
      console.log('Success response structure:', JSON.stringify(data, null, 2));

      // Look for image data in the response
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const parts = data.candidates[0].content.parts;
        console.log('Found parts in response:', parts.length);
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          console.log(`Part ${i}:`, JSON.stringify(part, null, 2));

          // Check different possible property names for image data
          if (part.inline_data?.data || part.inlineData?.data) {
            console.log('Found image data in response');
            const imageData = part.inline_data || part.inlineData;
            const mimeType = imageData.mime_type || imageData.mimeType || 'image/png';
            const imageUrl = `data:${mimeType};base64,${imageData.data}`;
            console.log('Image URL created successfully');
            return imageUrl;
          }

          // Also check for other possible structures
          if (part.image?.data) {
            console.log('Found image data in part.image');
            const mimeType = part.image.mime_type || 'image/png';
            const imageUrl = `data:${mimeType};base64,${part.image.data}`;
            return imageUrl;
          }
        }

        // If no image found, provide more detailed error
        console.error('No image data found in response parts. Parts structure:', parts);
        throw new Error('The model returned a response but no image was generated. This might be due to content restrictions or the model not supporting image generation for this specific prompt.');
      } else {
        console.error('Unexpected response structure:', data);
        throw new Error('Unexpected response structure from Gemini API');
      }
    } catch (error) {
      console.error('Error generating image with Gemini:', error);
      throw error;
    } finally {
      setIsGeneratingImage(false);
    }
  };
  const filterFormattingFromText = (text: string): string => {
    return text
      // Remove markdown-style asterisks for bold/emphasis
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove bullet points with asterisks
      .replace(/^\s*\*\s+/gm, '')
      // Remove multiple asterisks used as dividers
      .replace(/\*{3,}/g, '')
      // Clean up extra whitespace that might result from filtering
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  };
  const generateResponse = async (userMessage: string, attachments?: any[]) => {
    const GEMINI_API_KEY = 'AIzaSyDBMWX5dw8D2H18KG3Er8aieov_A7i2TIY';
    try {
      let prompt = userMessage;
      const parts: any[] = [];

      // Handle web search requests
      if (selectedFeature === 'search' || userMessage.toLowerCase().includes('search') || userMessage.toLowerCase().includes('latest')) {
        console.log('Performing web search...');
        const searchResults = await enhancedWebSearch(userMessage);
        return searchResults;
      }

      // Handle developer/creator questions
      if (userMessage.toLowerCase().includes('developer') || 
          userMessage.toLowerCase().includes('creator') || 
          userMessage.toLowerCase().includes('who made') ||
          userMessage.toLowerCase().includes('who created') ||
          userMessage.toLowerCase().includes('who developed') ||
          userMessage.toLowerCase().includes('who built')) {
        prompt = `I was developed by AKM, a talented developer who created me to be your comprehensive AI assistant. AKM designed me with advanced capabilities including file analysis, image generation, voice interaction, and intelligent conversation. ${userMessage}`;
      }

      // Enhanced prompt based on user intent and selected feature
      if (selectedFeature === 'image' || userMessage.toLowerCase().includes('generate image') || userMessage.toLowerCase().includes('create image')) {
        prompt = `I understand you want to generate an image. Here's a detailed description for image generation: ${userMessage}. While I can't directly generate images, I can provide detailed prompts for image generation tools.`;
      }
      if (selectedFeature === 'code') {
        prompt = `Please help with coding: ${userMessage}. Provide detailed code examples and explanations.`;
      }
      if (selectedFeature === 'research') {
        prompt = `Please conduct deep research on: ${userMessage}. Provide comprehensive analysis with multiple perspectives.`;
      }
      if (selectedFeature === 'thinking') {
        prompt = `Let me think deeply about this: ${userMessage}. I'll provide a thorough, well-reasoned response.`;
      }

      // Enhanced file processing with OCR support
      if (attachments && attachments.length > 0) {
        console.log('Processing attachments:', attachments.length);
        for (const attachment of attachments) {
          console.log('Processing attachment:', attachment.name, 'Type:', attachment.type, 'MIME:', attachment.file?.type);

          // Add file structure analysis to prompt
          const fileAnalysis = analyzeFileStructure(attachment.file);
          prompt += `\n\n${fileAnalysis}\n`;
          
          if (attachment.type === 'image' && attachment.file) {
            try {
              console.log('Converting image to base64...');
              const base64Data = await convertFileToBase64(attachment.file);
              const base64Image = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
              parts.push({
                inline_data: {
                  mime_type: attachment.file.type,
                  data: base64Image
                }
              });

              // Perform OCR if image contains text
              if (canPerformOCR(attachment.file)) {
                try {
                  console.log('Performing OCR on image...');
                  setIsPerformingOCR(true);
                  const ocrResult = await extractTextFromImage(attachment.file, {
                    onProgress: (progress) => console.log('OCR Progress:', progress)
                  });
                  
                  if (ocrResult.text.trim()) {
                    prompt += `\n\n📖 OCR TEXT EXTRACTED FROM IMAGE:\n\`\`\`\n${ocrResult.text}\n\`\`\`\n\nOCR Confidence: ${ocrResult.confidence.toFixed(2)}%\n\nPlease analyze both the visual content and the extracted text.`;
                  }
                } catch (ocrError) {
                  console.error('OCR Error:', ocrError);
                  prompt += `\n\n⚠️ OCR attempted but failed to extract text from image.`;
                } finally {
                  setIsPerformingOCR(false);
                }
              }

              prompt = `Please analyze this uploaded image in detail and ${prompt}`;
            } catch (error) {
              console.error('Error processing image:', error);
              throw new Error(`Failed to process image ${attachment.name}: ${error}`);
            }
          } else if (attachment.file && isTextFile(attachment.file)) {
            try {
              console.log('Reading text file content...');
              const fileContent = await readFileAsText(attachment.file);
              console.log('File content read successfully, length:', fileContent.length);

              // Analyze content structure
              const lines = fileContent.split('\n').length;
              const words = fileContent.split(/\s+/).length;
              const chars = fileContent.length;
              prompt += `\n\n📝 Content Analysis:\n• Lines: ${lines}\n• Words: ${words}\n• Characters: ${chars}\n\nFile Content:\n\`\`\`\n${fileContent.length > 10000 ? fileContent.substring(0, 10000) + '\n... (content truncated)' : fileContent}\n\`\`\`\n\nPlease analyze this file content comprehensively. If it's code, explain its functionality. If it's data, analyze patterns. If it's documentation, summarize key points.`;
            } catch (error) {
              console.error('Error reading text file:', error);
              prompt += `\n\n⚠️ Could not read text content from ${attachment.name}. Please provide analysis based on file metadata.`;
            }
          } else if (attachment.file && isBinaryFile(attachment.file)) {
            // For binary files, provide detailed metadata analysis
            prompt += `\n\n🔍 Binary File Detected: ${attachment.name}\nThis appears to be a binary file format. Based on the file extension and MIME type, please provide:\n• Expected file structure and format\n• Common use cases and applications\n• Possible content analysis approaches\n• Recommendations for further processing`;
          } else if (attachment.file) {
            // For any other file types
            prompt += `\n\n📎 File Upload: ${attachment.name}\n• MIME Type: ${attachment.file.type}\n• Category: ${attachment.file.type.startsWith('audio/') ? 'Audio' : attachment.file.type.startsWith('video/') ? 'Video' : attachment.file.type.startsWith('application/') ? 'Application' : 'Other'}\n\nPlease analyze this file based on its type and provide relevant insights about its likely content and structure.`;
          }
        }
      }

      // Add the text prompt after processing all files
      parts.push({
        text: prompt
      });

      console.log('Final prompt:', prompt);
      console.log('Total parts in request:', parts.length);

      const requestBody = {
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      };

      console.log('Sending request to Gemini API...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error Details:', errorData);
        throw new Error(`Failed to get response from Gemini AI: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Gemini API response received');

      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const rawText = data.candidates[0].content.parts[0].text;
        // Apply filtering to remove asterisks and formatting
        const filteredText = filterFormattingFromText(rawText);
        return filteredText;
      } else {
        console.error('Unexpected response structure:', data);
        throw new Error('Unexpected response structure from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini AI:', error);
      throw error;
    }
  };

  // New: Chat history functions
  const loadChat = (sessionId: string) => {
    const sessionMessages = loadChatSession(sessionId);
    if (sessionMessages) {
      setMessages(sessionMessages);
      setCurrentSessionId(sessionId);
      setShowChatHistory(false);
      toast({
        title: "Chat loaded",
        description: "Previous conversation restored"
      });
    }
  };

  const startNewChat = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m AKM BOT, your advanced AI assistant. How can I help you today?',
      timestamp: new Date()
    }]);
    setCurrentSessionId(null);
    setShowChatHistory(false);
    toast({
      title: "New chat started",
      description: "Ready for a fresh conversation"
    });
  };

  const deleteChat = (sessionId: string) => {
    deleteChatSession(sessionId);
    const updatedHistory = getChatHistory();
    setChatHistory(updatedHistory);
    if (currentSessionId === sessionId) {
      startNewChat();
    }
    toast({
      title: "Chat deleted",
      description: "Conversation removed from history"
    });
  };

  // Feature selection handler
  const handleFeatureSelect = (feature: string, prompt: string) => {
    setSelectedFeature(feature);
    setInputValue(prompt);
    toast({
      title: "Feature selected",
      description: `${feature} mode activated`
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return;

    // Check if this is an image generation request
    const isImageGenRequest = selectedFeature === 'image' || inputValue.toLowerCase().includes('generate image') || inputValue.toLowerCase().includes('create image') || inputValue.toLowerCase().includes('draw') || inputValue.toLowerCase().includes('make image') || inputValue.toLowerCase().includes('paint') || inputValue.toLowerCase().includes('design');
    console.log('Input value:', inputValue);
    console.log('Is image generation request:', isImageGenRequest);
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue || 'Shared files',
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? attachedFiles : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    const currentAttachments = [...attachedFiles];
    setAttachedFiles([]);
    setSelectedFeature(null);
    setIsLoading(true);
    try {
      if (isImageGenRequest) {
        console.log('Starting image generation with Gemini...');
        // Generate image with Gemini
        const imageUrl = await generateImageWithGemini(inputValue);
        console.log('Image generated successfully');
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `I've generated an image based on your prompt: "${inputValue}"`,
          timestamp: new Date(),
          generatedImage: {
            url: imageUrl,
            prompt: inputValue
          }
        };
        setMessages(prev => [...prev, assistantMessage]);
        toast({
          title: "Image generated",
          description: "Your image has been created successfully with Gemini"
        });
      } else {
        // Regular text response with Gemini
        const response = await generateResponse(inputValue || 'Please analyze the uploaded files', currentAttachments);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        toast({
          title: "Response generated",
          description: "AI has responded to your message"
        });
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I apologize, but I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleFileUpload = (type: 'image' | 'audio' | 'file') => {
    const input = type === 'image' ? imageInputRef : type === 'audio' ? audioInputRef : fileInputRef;
    input.current?.click();
  };
  const processFileUpload = (file: File, type: 'image' | 'audio' | 'file') => {
    const url = URL.createObjectURL(file);
    const newAttachment = {
      type,
      name: file.name,
      url,
      file,
      fileType: file.type,
      fileSize: file.size
    };
    setAttachedFiles(prev => [...prev, newAttachment]);

    // Enhanced file upload feedback
    const sizeStr = file.size < 1024 ? `${file.size} bytes` : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    toast({
      title: "File attached successfully!",
      description: `${file.name} (${sizeStr}) is ready for analysis`
    });
    console.log('File attached:', file.name, 'Type:', file.type, 'Size:', file.size);
  };
  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard"
    });
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Main Chat Area - Dark Theme */}
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent font-semibold">AKM BOT</h1>
                  <p className="text-xs text-gray-400">Gemini Genesis Portal</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChatHistory(!showChatHistory)}
                  className="text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                  title="Chat History"
                >
                  <History className="w-4 h-4" />
                </Button>
                <Badge variant="outline" className="bg-gray-800/50 border-gray-600/50 text-gray-300 text-xs">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                  Online
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Chat History Sidebar */}
        {showChatHistory && (
          <div className="absolute top-16 right-4 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-200">Chat History</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startNewChat}
                    className="text-gray-400 hover:text-gray-200 h-6 w-6 p-0"
                    title="New Chat"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChatHistory(false)}
                    className="text-gray-400 hover:text-gray-200 h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
            <ScrollArea className="max-h-80">
              <div className="p-2">
                {chatHistory.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No chat history yet</p>
                ) : (
                  chatHistory.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                        currentSessionId === session.id
                          ? 'bg-purple-600/20 border border-purple-500/30'
                          : 'hover:bg-gray-700/50'
                      }`}
                      onClick={() => loadChat(session.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate">{session.title}</p>
                          <p className="text-xs text-gray-400">
                            {session.updatedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(session.id);
                          }}
                          className="text-gray-400 hover:text-red-400 h-6 w-6 p-0"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div 
                    key={message.id} 
                    className={`flex gap-4 animate-fade-in ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {message.type === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center animate-pulse">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-gray-800/50 border border-gray-700/50'} rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
                      <div className="prose prose-sm max-w-none text-gray-100">
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                      
                      {/* Display generated images */}
                      {message.generatedImage && (
                        <div className="mt-4 animate-scale-in">
                          <img 
                            src={message.generatedImage.url} 
                            alt={message.generatedImage.prompt} 
                            className="max-w-full rounded-lg shadow-xl border border-gray-600" 
                          />
                          <p className="text-xs text-gray-400 mt-2">Generated from: "{message.generatedImage.prompt}"</p>
                        </div>
                      )}
                      
                      {/* Enhanced attachments display */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {message.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                              {getFileIcon(attachment.name, attachment.file?.type || '')}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium truncate block text-gray-200">{attachment.name}</span>
                                {attachment.fileSize && (
                                  <span className="text-xs text-gray-400">
                                    {attachment.fileSize < 1024 ? `${attachment.fileSize} bytes` : 
                                     attachment.fileSize < 1024 * 1024 ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : 
                                     `${(attachment.fileSize / 1024 / 1024).toFixed(1)} MB`}
                                  </span>
                                )}
                              </div>
                              {attachment.type === 'image' && (
                                <img src={attachment.url} alt={attachment.name} className="max-w-16 max-h-16 object-cover rounded border border-gray-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-600/30">
                        <span className="text-xs text-gray-400">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(message.content)} 
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          {message.type === 'assistant' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => textToSpeech.speak(message.content)}
                                disabled={!textToSpeech.isSupported}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                                title="Read aloud"
                              >
                                {textToSpeech.isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                              </Button>
                              {textToSpeech.isSpeaking && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={textToSpeech.stop}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                                  title="Stop reading"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {(isLoading || isGeneratingImage || isPerformingOCR) && (
                  <div className="flex gap-4 justify-start animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center animate-pulse">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-400">
                          {isGeneratingImage ? 'Generating your image...' : 
                           isPerformingOCR ? 'Extracting text from image...' : 
                           'Thinking...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area - Enhanced with new features */}
        <div className="border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Enhanced Attached Files Preview */}
            {attachedFiles.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-700/50 text-gray-300 px-3 py-2 rounded-lg text-sm border border-gray-600/50">
                      {getFileIcon(file.name, file.file?.type || '')}
                      <div className="flex flex-col">
                        <span className="truncate max-w-32 font-medium">{file.name}</span>
                        {file.fileSize && (
                          <span className="text-xs text-gray-400">
                            {file.fileSize < 1024 ? `${file.fileSize} bytes` : 
                             file.fileSize < 1024 * 1024 ? `${(file.fileSize / 1024).toFixed(1)} KB` : 
                             `${(file.fileSize / 1024 / 1024).toFixed(1)} MB`}
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeAttachment(index)} 
                        className="h-4 w-4 p-0 text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 items-end">
              {/* Enhanced Tools Dropdown - ChatGPT Style */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-all duration-200" 
                    title="Tools"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" side="top" align="start">
                  <DropdownMenuItem 
                    onClick={() => handleFeatureSelect('image', 'Create an image of ')}
                    className="text-gray-200 hover:bg-gray-700 cursor-pointer"
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Create an image
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleFeatureSelect('search', 'Search the web for ')}
                    className="text-gray-200 hover:bg-gray-700 cursor-pointer"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Search the web
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleFeatureSelect('code', 'Write or code ')}
                    className="text-gray-200 hover:bg-gray-700 cursor-pointer"
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Write or code
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={() => handleFeatureSelect('research', 'Run deep research on ')}
                    className="text-gray-200 hover:bg-gray-700 cursor-pointer"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Run deep research
                    <span className="ml-auto text-xs text-gray-400">5 left</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleFeatureSelect('thinking', 'Think for longer about ')}
                    className="text-gray-200 hover:bg-gray-700 cursor-pointer"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Think for longer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={() => handleFileUpload('image')}
                    className="text-gray-200 hover:bg-gray-700 cursor-pointer"
                  >
                    <ScanText className="w-4 h-4 mr-2" />
                    Upload for OCR
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Main Input */}
              <div className="flex-1 relative">
                <div className="relative flex items-center">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={voiceRecording.isRecording ? "Listening..." : selectedFeature ? `${selectedFeature} mode active...` : "Ask anything..."}
                    className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 pr-20 min-h-[48px] rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-200"
                    disabled={isLoading || voiceRecording.isRecording || isGeneratingImage || isPerformingOCR}
                  />
                  
                  {/* Inline Action Buttons */}
                  <div className="absolute right-2 flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleFileUpload('image')} 
                      className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-600/50 transition-all duration-200" 
                      title="Upload Images"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={voiceRecording.toggleRecording} 
                      className={`p-1.5 transition-all duration-200 ${
                        voiceRecording.isRecording 
                          ? 'text-red-400 animate-pulse' 
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-600/50'
                      }`} 
                      disabled={!voiceRecording.isSupported} 
                      title="Voice Input"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleFileUpload('file')} 
                      className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-600/50 transition-all duration-200" 
                      title="Upload File"
                    >
                      <File className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0) || voiceRecording.isRecording || isGeneratingImage || isPerformingOCR} 
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white p-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge 
                variant="outline" 
                className="text-xs bg-gray-800/50 border-gray-600/50 text-gray-400 hover:bg-gray-700/50 cursor-pointer transition-all duration-200"
                onClick={() => handleFeatureSelect('image', 'Create an image of a ')}
              >
                <Palette className="w-3 h-3 mr-1" />
                Create an image
              </Badge>
              <Badge 
                variant="outline" 
                className="text-xs bg-gray-800/50 border-gray-600/50 text-gray-400 hover:bg-gray-700/50 cursor-pointer transition-all duration-200"
                onClick={() => handleFeatureSelect('search', 'Search the web for ')}
              >
                <Search className="w-3 h-3 mr-1" />
                Search the web
              </Badge>
              <Badge 
                variant="outline" 
                className="text-xs bg-gray-800/50 border-gray-600/50 text-gray-400 hover:bg-gray-700/50 cursor-pointer transition-all duration-200"
                onClick={() => handleFeatureSelect('code', 'Write code for ')}
              >
                <Code className="w-3 h-3 mr-1" />
                Write or code
              </Badge>
              <Badge 
                variant="outline" 
                className="text-xs bg-gray-800/50 border-gray-600/50 text-gray-400 hover:bg-gray-700/50 cursor-pointer transition-all duration-200"
                onClick={() => handleFileUpload('image')}
              >
                <ScanText className="w-3 h-3 mr-1" />
                Extract text (OCR)
              </Badge>
            </div>

            {/* Hidden File Inputs */}
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                processFileUpload(file, 'image');
              }
            }} />
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                processFileUpload(file, 'audio');
              }
            }} />
            <input ref={fileInputRef} type="file" accept="*/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                processFileUpload(file, 'file');
              }
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
