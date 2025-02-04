import { Link } from "react-router-dom";
import "./chatList.css";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from "react";
import { ScaleLoader } from "react-spinners";
import Markdown from "react-markdown";

const ChatList = () => {
  const { getToken } = useAuth();
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [isResumePopupVisible, setIsResumePopupVisible] = useState(false);
  const [job_description, setJobDescription] = useState("");
  const [special_customization, setspecial_customization] = useState("");
  const [generatedResponse, setGeneratedResponse] = useState("");  // Store OpenAI's response
  const [isResponsePopupVisible, setIsResponsePopupVisible] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleResumeSubmit = async () => {
    const token = await getToken();
    setIsResponsePopupVisible(true);
    setGeneratedResponse("");  
    setIsResumePopupVisible(false);

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

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        result += decoder.decode(value, { stream: true });
        setGeneratedResponse(result);
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
      <hr />

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

      <div className="generate-resume">
        <button onClick={() => setIsResumePopupVisible(true)}>
          Generate Resume
        </button>
      </div>

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
              <ScaleLoader size={20} color={"black"} loading={isPending} />
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
            <h2>Response from Crafter</h2>
            <div className="markdown-container">
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
