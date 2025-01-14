import { useEffect, useRef, useState } from "react";
import "./newPrompt.css";
import Upload from "../upload/Upload";
import { IKImage } from "imagekitio-react";
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NewPrompt = ({ data }) => {

  const history = useRef(
    data?.history?.map(({ role, parts }) => ({
      role,
      content: parts[0]?.text || "",
    })) || []
  );

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
  const textRef = useRef(null); // Reference to the input or textarea element

  const queryClient = useQueryClient();

  // Reset textarea size when the answer is received
  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = "auto"; // Reset the height
      textRef.current.style.height = `${textRef.current.scrollHeight}px`; // Adjust the height based on content
    }
  }, [answer]);

  const mutation = useMutation({
    mutationFn: () => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.length ? question : undefined,
          answer: answer.length ? answer: undefined,
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
      history.current.push({ role: "user", content: text }); // Add user message to history
    }

    // Prepare the recent history: keep only the last 6 messages
    const recentHistory = [...history.current].slice(-6);

    try {
      // Sending history and user message to /ai/openai
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/openai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: recentHistory, // Include history
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from OpenAI");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamingAnswer = "";
  
      let done = false; // Initialize the done flag

      while (!done) {
        const { value, done: chunkDone } = await reader.read();
        done = chunkDone; // Update the done flag with the current chunk's status
      
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          streamingAnswer += chunk;
      
          // Update the answer state with the new chunk
          setAnswer((prev) => prev + chunk);
        }
      }

      // Add the final assistant's response to history
      history.current.push({ role: "assistant", content: streamingAnswer });

      // Use setTimeout to delay the mutation until state is updated
      setTimeout(() => {
        mutation.mutate(); // Trigger the mutation to save the chat
      }, 500);
    } catch (err) {
      console.error("Error in addMessage:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const text = e.target.text.value;
    if (!text) return;
  
    e.target.text.value = ""; // Clear the textarea immediately
    add(text, false); // Process the input
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

  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = "auto"; // Reset height
      textRef.current.style.height = `${textRef.current.scrollHeight}px`; // Adjust height
    }
  }, [question]); // Re-adjust when `question` changes
  

  return (
    <>
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
  <textarea
    name="text"
    placeholder="Ask anything..."
    ref={textRef}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // Prevent newline
        formRef.current.requestSubmit(); // Submit the form
      }
    }}
    onInput={(e) => {
      e.target.style.height = "auto"; // Reset height
      e.target.style.height = `${e.target.scrollHeight}px`; // Adjust height
    }}
  ></textarea>
  <button>
    <img src="/arrow.png" alt="Send" />
  </button>
</form>

    </>
  );
};

export default NewPrompt;
