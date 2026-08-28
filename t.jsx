'use client';
import { useState, useEffect, useRef } from 'react';

export default function Dashboard() {
  // Mode Selection: 'admin' (Paste Text) ឬ 'json' (ជ្រើសរើស File)
  const [selectedMode, setSelectedMode] = useState('admin');

  // JSON Files List
  const jsonFiles = [
    { name: 'សំណួរ Set 1', path: '/data/questions_set1.json' },
    { name: 'សំណួរ Set 2', path: '/data/questions_set2.json' }
  ];
  const [selectedFile, setSelectedFile] = useState(jsonFiles[0].path);

  // System Queue State
  const [questions, setQuestions] = useState([
    "តើប្រាសាទអង្គរវត្តស្ថិតនៅឯណា?",
    "តើវាស្ថិតនៅក្នុងខេត្តណា និងទ្វីបណាដែរ?"
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("រង់ចាំ");
  const [aiResponse, setAiResponse] = useState("");
  const [inputText, setInputText] = useState("");

  const timeoutRef = useRef(null);

  // ១. ទាញយក JSON File ពេល Select លើ Option JSON Mode
  const handleLoadJson = async (filePath) => {
    try {
      setStatus(`កំពុងទាញយក File: ${filePath}...`);
      const res = await fetch(filePath);
      const data = await res.json();
      // ដកស្រង់យកតែ Text សំណួរ
      const formatted = data.map(q => typeof q === 'string' ? q : q.text);
      setQuestions(formatted);
      setCurrentIndex(0);
      setStatus("បានផ្ទុក File JSON រួចរាល់!");
    } catch (err) {
      setStatus("❌ បរាជ័យក្នុងការទាញយក File JSON");
    }
  };

  // ២. បន្ថែម Text ចូល Queue សម្រាប់ Admin Mode
  const handleAddAdminText = () => {
    if (!inputText.trim()) return;
    const newLines = inputText.split('\n').filter(q => q.trim() !== "");
    setQuestions(prev => [...prev, ...newLines]);
    setInputText("");
    setStatus(`✅ បានបន្ថែម ${newLines.length} សំណួរទៅក្នុង Queue!`);
  };

  // ៣. មុខងារ Skip Next
  const handleSkipNext = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (currentIndex + 1 < questions.length) {
      setStatus("⏩ បាន Skip ទៅសំណួរបន្ទាប់...");
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setStatus("🎉 បានបញ្ចប់សំណួរទាំងអស់នៅក្នុង Queue!");
    }
  };

  // ៤. ផ្ញើសំណួរ & កំណត់ Timeout (៣ វិនាទី)
  const sendQuestion = (text) => {
    setStatus(`⚡ កំពុងផ្ញើសំណួរទី ${currentIndex + 1}...`);
    setAiResponse("");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStatus("⚠️ គ្មានការឆ្លើយតប! កំពុង Auto-Skip...");
      handleSkipNext();
    }, 3000);
  };

  // ៥. ទទួល Signal ពេល AI ឆ្លើយតបចប់
  const handleIncomingGibberlink = (data, isCompleted) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAiResponse(prev => prev + " " + data);

    if (isCompleted) {
      setStatus("✅ AI ឆ្លើយតបចប់! កំពុង Next...");
      setTimeout(() => {
        handleSkipNext();
      }, 500);
    }
  };

  useEffect(() => {
    if (isPlaying && questions.length > 0 && currentIndex < questions.length) {
      sendQuestion(questions[currentIndex]);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, isPlaying]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '750px', margin: 'auto' }}>
      <h2>AI Hybrid Control Dashboard (Dual Mode)</h2>

      {/* ផ្នែកជ្រើសរើស Option / Mode ប្រើប្រាស់ */}
      <div style={{ border: '1px solid #0070f3', padding: '15px', borderRadius: '8px', marginBottom: '20px', background: '#f4f8ff' }}>
        <h3>⚙️ ជ្រើសរើសប្រភពសំណួរ (Source Option):</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
          <label style={{ fontWeight: 'bold', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="mode" 
              value="admin" 
              checked={selectedMode === 'admin'} 
              onChange={() => setSelectedMode('admin')} 
            /> Option 1: Custom Admin Input (Paste Text)
          </label>
          <label style={{ fontWeight: 'bold', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="mode" 
              value="json" 
              checked={selectedMode === 'json'} 
              onChange={() => setSelectedMode('json')} 
            /> Option 2: Select JSON File
          </label>
        </div>

        {/* ករណីជ្រើសរើស Option 1: Admin Text Input */}
        {selectedMode === 'admin' && (
          <div>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste សំណួរទីនេះ (ចុះបន្ទាត់ដើម្បីថែមសំណួរផ្សេងទៀត)..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
            />
            <button 
              onClick={handleAddAdminText} 
              style={{ marginTop: '5px', padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              + បន្ថែមចូល Queue
            </button>
          </div>
        )}

        {/* ករណីជ្រើសរើស Option 2: JSON Selector */}
        {selectedMode === 'json' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select 
              value={selectedFile} 
              onChange={(e) => setSelectedFile(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px' }}
            >
              {jsonFiles.map((file, idx) => (
                <option key={idx} value={file.path}>{file.name} ({file.path})</option>
              ))}
            </select>
            <button 
              onClick={() => handleLoadJson(selectedFile)}
              style={{ padding: '8px 15px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Load JSON នេះ
            </button>
          </div>
        )}
      </div>

      {/* ផ្នែក Display & Main Dashboard Controls */}
      <div style={{ border: '2px solid #222', padding: '20px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h4>សំណួរទី ({questions.length > 0 ? currentIndex + 1 : 0}/{questions.length}):</h4>
          <span>Mode ៖ <strong>{selectedMode.toUpperCase()}</strong></span>
        </div>

        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0051a8' }}>
          {questions[currentIndex] || "គ្មានសំណួរនៅក្នុង Queue ទេ"}
        </p>

        <p><strong>ស្ថានភាពប្រព័ន្ធ៖</strong> <span style={{ color: 'red' }}>{status}</span></p>

        <h4>ទិន្នន័យ Gibberlink ដែលទទួលបាន៖</h4>
        <div style={{ background: '#1e1e1e', color: '#00ff66', padding: '10px', borderRadius: '5px', fontFamily: 'monospace', minHeight: '50px' }}>
          {aiResponse || "// រង់ចាំ Signal..."}
        </div>

        {/* Control Buttons */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: '10px 20px', background: isPlaying ? '#dc3545' : '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            {isPlaying ? "បញ្ឈប់" : "ចាប់ផ្ដើម Auto-Play"}
          </button>

          <button
            onClick={handleSkipNext}
            disabled={!isPlaying}
            style={{ padding: '10px 20px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '5px' }}
          >
            ⏭️ Skip Next
          </button>

          {isPlaying && (
            <button
              onClick={() => handleIncomingGibberlink("{"status":"complete"}", true)}
              style={{ padding: '10px 15px', background: '#20c997', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              [Test] AI ឆ្លើយតបចប់
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
