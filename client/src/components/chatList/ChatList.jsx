import { Link } from "react-router-dom";
import "./chatList.css";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from "react";
import { ScaleLoader, ClipLoader, SyncLoader } from "react-spinners";
import Markdown from "react-markdown";

const ChatList = () => {
  const { getToken } = useAuth();
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [isResumePopupVisible, setIsResumePopupVisible] = useState(false);
  const [isGeneralChatVisible, setIsGeneralChatVisible] = useState(false);
  const [job_description, setJobDescription] = useState("");
  const [special_customization, setspecial_customization] = useState("");
  const [generatedResponse, setGeneratedResponse] = useState("");
  const [isResponsePopupVisible, setIsResponsePopupVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [generalChatInput, setGeneralChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const getChats = async () => {
    const token = await getToken();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer ' + token
      }
    });
    return res.json();
  };

  const handleSubmit = async () => {
    const token = await getToken();
    await fetch(`${import.meta.env.VITE_API_URL}/api/prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer ' + token
      },
      body: JSON.stringify({ prompt: additionalInfo })
    });
    setIsInputVisible(false);
  };

  const handleGeneralChatSubmit = async () => {
    if (!generalChatInput.trim()) return;

    const token = await getToken();
    setLoading(true);
    setIsStreaming(false);

    // Add user message immediately
    setChatMessages(prev => [...prev, { role: 'user', content: generalChatInput }]);

    // Get the last 6 messages plus current message
    const messages = [...chatMessages.slice(-6), { role: 'user', content: generalChatInput }];
    
    const res = await fetch(`${import.meta.env.VITE_API_URL}/ai/general`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer ' + token
      },
      body: JSON.stringify({ messages })
    });

    if (res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let result = '';
      let firstChunkReceived = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          result += decoder.decode(value, { stream: true });
          
          if (!firstChunkReceived) {
            firstChunkReceived = true;
            setIsStreaming(true);
            setLoading(false);
            // Add assistant message when first chunk arrives
            setChatMessages(prev => [...prev, { role: 'assistant', content: result }]);
          } else {
            // Update the last message (assistant's response)
            setChatMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                content: result
              };
              return newMessages;
            });
          }
        }
      }
    }

    setGeneralChatInput("");
};
  const handleResumeSubmit = async () => {
    const token = await getToken();
    setIsResponsePopupVisible(true);
    setGeneratedResponse("");  
    setIsResumePopupVisible(false);
    setLoading(true);
    setIsStreaming(false);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/ai/openai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer ' + token
      },
      body: JSON.stringify({ job_description, special_customization })
    });

    if (res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let result = '';
      let firstChunkReceived = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          result += decoder.decode(value, { stream: true });
          setGeneratedResponse(result);

          if (!firstChunkReceived) {
            firstChunkReceived = true;
            setIsStreaming(true);
            setLoading(false);
          }
        }
      }
    }
  };

  const { isPending, error, data } = useQuery({
    queryKey: ["userChats"],
    queryFn: getChats,
  });

  useEffect(() => {
    if (data?.additional_prompt) {
      setAdditionalInfo(data.additional_prompt);
    }
  }, [data]);

  return (
    <div className="chatList">
      <span className="title"><b>DASHBOARD</b></span>
      <Link to="/dashboard">Create a new Chat</Link>
      

      <div className="new-chat">
        <button onClick={() => setIsInputVisible(!isInputVisible)}>
          {isInputVisible ? "Hide" : "Customize Crafter ▼"}
        </button>
        {isInputVisible && (
          <div className="input-container">
            <textarea
              placeholder="Enter your customization..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
            <button onClick={handleSubmit}>Save</button>
          </div>
        )}
      </div>

      <div className="generate-buttons">
        <button onClick={() => setIsResumePopupVisible(true)}>
          Generate Resume
        </button>
        <button onClick={() => setIsGeneralChatVisible(true)}>
          General Chat
        </button>
      </div>

      {isGeneralChatVisible && (
        <div className="popup-overlay">
          <div className="popup-content chat-popup">
            <button className="close-btn" onClick={() => setIsGeneralChatVisible(false)}>X</button>
            <h2>General Chat</h2>
            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  <div className="message-content">
                    <Markdown>{message.content}</Markdown>
                  </div>
                </div>
              ))}
              {loading && !isStreaming && (
                <div className="loader-container">
                  <p>Thinking</p><ClipLoader size={15} color={"black"} />
                </div>
              )}
            </div>
            <div className="chat-input">
              <textarea
                placeholder="Type your message..."
                value={generalChatInput}
                onChange={(e) => setGeneralChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGeneralChatSubmit();
                  }
                }}
              />
              <button onClick={handleGeneralChatSubmit} disabled={loading || !generalChatInput.trim()}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {isResumePopupVisible && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="close-btn" onClick={() => setIsResumePopupVisible(false)}>X</button>
            <h2>Enter Job Description</h2>
            <textarea
              placeholder="Enter job description..."
              value={job_description}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <textarea
              placeholder="Enter special customization"
              value={special_customization}
              onChange={(e) => setspecial_customization(e.target.value)}
            />
            <button onClick={handleResumeSubmit} disabled={loading}>
              {loading ? "Generating..." : "Generate Resume"}
            </button>
          </div>
        </div>
      )}

      <hr />
      <span className="title"><b>RECENT CHATS</b></span>
      <div className="list">
        {isPending ? (
          <div className="loader">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ScaleLoader size={25} color={"black"} loading={isPending} />
            </div>
          </div>
        ) : error ? (
          "Something went wrong!"
        ) : (
          data?.chats?.map((chat) => (
            <Link to={`/dashboard/chats/${chat._id}`} key={chat._id}>
              {chat.title}
            </Link>
          ))
        )}
      </div>

      {isResponsePopupVisible && (
        <div className="response-popup-overlay">
          <div className="response-popup-content">
            <button className="close-btn" onClick={() => setIsResponsePopupVisible(false)}>X</button>
            <h2>Generating Resume</h2>
            <div className="markdown-container">
              {loading && !isStreaming && (
                <div className="loader-container">
                  <p>Thinking</p><ClipLoader size={15} color={"black"} />
                </div>
              )}
              <Markdown>{generatedResponse}</Markdown>
            </div>
          </div>
        </div>
      )}

      <hr />
      <div className="upgrade">
        <img src="/logo.png" alt="" />
        <div className="texts">
          <span>Enjoy the superpowers of crafter.</span>
          <span>Complete the work swiftly.</span>
        </div>
      </div>
    </div>
  );
};

export default ChatList;