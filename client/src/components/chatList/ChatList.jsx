import { Link } from "react-router-dom";
import "./chatList.css";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from "react";
import { ClipLoader, ScaleLoader } from "react-spinners";

const ChatList = () => {
  const { getToken } = useAuth();
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isInputVisible, setIsInputVisible] = useState(false);  // 🔹 Toggle input visibility

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
    console.log("Sending:", JSON.stringify({ prompt: additionalInfo }));
    await fetch(`${import.meta.env.VITE_API_URL}/api/prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer ' + token
      },
      body: JSON.stringify({ prompt: additionalInfo })
    });

    // setAdditionalInfo(""); // Clear input after submission
    setIsInputVisible(false); // Hide input after submission
  };

  const { isPending, error, data } = useQuery({
    queryKey: ["userChats"],
    queryFn: getChats,
  });

  // 🔹 Load saved prompt when data is available
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

      {/* 🔹 Dropdown-style Create New Chat */}
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
