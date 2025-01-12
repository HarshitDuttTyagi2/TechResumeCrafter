import { useEffect, useRef, useState } from "react";
import "./newPrompt.css";
import Upload from "../upload/Upload";
import { IKImage } from "imagekitio-react";
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NewPrompt = ({ data }) => {
    // Process data.history to initialize messages state
    const initialMessages = data?.history?.map(({ role, parts }) => ({
      role,
      content: parts[0]?.text || "",
    })) || [];

  const [messages, setMessages] = useState(initialMessages);
  const [question, setQuestion] = useState(""); // Holds the current user's question
  const [answer, setAnswer] = useState(""); 
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  const endRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [data, question, answer, img.dbData]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ question, answer }) => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          answer,
          img: img.dbData?.filePath || undefined,
        }),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ["chat", data._id] })
        .then(() => {
          formRef.current.reset();
          setQuestion(""); // Reset the question after successful mutation
          setAnswer(""); 
          setImg({
            isLoading: false,
            error: "",
            dbData: {},
            aiData: {},
          });
        });
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const add = async (text, isInitial) => {
    if (!isInitial) {
      setQuestion(text);
      setMessages((prev) => [...prev, { role: "user", content: text }]); // Add user message to messages state
    }
    

     // Prepare the history: keep only the last 3 user and assistant messages
  const recentHistory = [...messages, { role: "user", content: text }]
  .slice(-6); // Last 3 user-assistant pairs (each pair is 2 messages)

  console.log("Sending messages to backend:", recentHistory);

    try {
      // Sending history and user message to /ai/openai
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/openai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        
        body: JSON.stringify({
          messages: recentHistory, // Include history and current user message
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch response from OpenAI");
      }
  
      const result = await response.json();
      const responseText = result.answer; // Extract only the `answer` field
  
      if (!responseText) {
        throw new Error("No answer received from the API");
      }
  
      // Set the assistant's answer
      setAnswer(responseText);
  
      // // Add the assistant's response to the conversation
      setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
  
      // Save the conversation to the backend
      mutation.mutate({
        question: text,
        answer: responseText,
    });
    } catch (err) {
      console.error("Error in addMessage:", err);
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    const text = e.target.text.value;
    if (!text) return;

    add(text, false);
  };

  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      if (data?.history?.length === 1) {
        add(data.history[0].parts[0].text, true);
      }
    }
    hasRun.current = true;
  }, []);
  

  return (
<>
      {/* ADD NEW CHAT */}
      {img.isLoading && <div className="">Loading...</div>}
      {img.dbData?.filePath && (
        <IKImage
          urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
          path={img.dbData?.filePath}
          width="380"
          transformation={[{ width: 380 }]}
        />
      )}
      {question && <div className="message user">{question}</div>}
      {answer && (
        <div className="message">
          <Markdown>{answer}</Markdown>
        </div>
      )}
      <div className="endChat" ref={endRef}></div>
      <form className="newForm" onSubmit={handleSubmit} ref={formRef}>
        <Upload setImg={setImg} />
        <input id="file" type="file" multiple={false} hidden />
        <input type="text" name="text" placeholder="Ask anything..." />
        <button>
          <img src="/arrow.png" alt="" />
        </button>
      </form>
    </>
  );
};

export default NewPrompt;