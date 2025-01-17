import { useMutation, useQueryClient } from "@tanstack/react-query";
import "./dashboardPage.css";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";

const DashboardPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (text) => {
          // Retrieve the token from the cookies
    const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("Cookie"))
    ?.split("=")[1]; // Replace "authToken" with your cookie name

  if (!token) {
    throw new Error("Authentication token not found.");
  }
  console.log(token);
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }).then((res) => res.json());
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
      navigate(`/dashboard/chats/${id}`);
    },
  });

  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    mutation.mutate(text);
    setText(""); // Clear the textarea after submission
  };

  const handleInputChange = (e) => {
    setText(e.target.value);

    // Dynamically adjust the height of the textarea
    const textarea = textareaRef.current;
    textarea.style.height = "auto"; // Reset height
    textarea.style.height = `${textarea.scrollHeight}px`; // Adjust to content
  };

  return (
    <div className="dashboardPage">
      <div className="texts">
        <div className="logo">
          <img src="/logo.png" alt="" />
          <h1>TECH RESUME CRAFTER</h1>
        </div>
        <div className="options">
           {/* <div className="option">
            <img src="/chat.png" alt="" />
            <span>Create a New Chat</span>
          </div>
           <div className="option">
            <img src="/image.png" alt="" />
            <span>Analyze Images</span>
          </div> 
           <div className="option">
            <img src="/code.png" alt="" />
            <span>Help me with my Code</span>
          </div>  */}
        </div>
      </div>
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            name="text"
            placeholder="Ask me anything..."
            value={text}
            onChange={handleInputChange}
            rows="1" // Default rows
            className="expandingTextarea"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevent newline
                handleSubmit(e); // Submit the form
              }
            }}
          />
          <button type="submit">
            <img src="/arrow.png" alt="" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DashboardPage;
