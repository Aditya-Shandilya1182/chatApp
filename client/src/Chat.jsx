import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "./UserContext.jsx";
import Logo from "./Logo";
import Avatar from "./Avatar";
//import axios from "axios";

export default function Chat() {
  const [ws, wsSet] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedUserId,setSelectedUserId] = useState(null);
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4040");
    wsSet(ws);
    ws.addEventListener("message", handleMessage);
  }, []);

  function showOnlineUsers(usersArray) {
    const users = {};
    usersArray.forEach(({ userId, username }) => {
      users[userId] = username;
    });
    setOnlineUsers(users);
  }

  function handleMessage(event) {
    const messageData = JSON.parse(event.data);
    if ("online" in messageData) {
      showOnlineUsers(messageData.online);
    }
  }

  function selectContact(userId) {
    selectedUserId(userId);
  }

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 flex flex-col">
        <Logo />

        {Object.keys(onlineUsers).map((userId) => (
          <div onClick={() => selectContact(userId)} className={"border-b border-gray-100 py-2 flex items-center gap-2 cursor-pointer" + (userId === selectContact ? 'bg-blue-200' : '')}>
              <Avatar username={onlineUsers[userId]} userId= {userId}/>
            <span className="text-gray-700">{onlineUsers[userId]}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">msg with someone</div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="TYPE YOUR MESSAGE"
            className="bg-white flex-grow p-2 border rounded-sm"
          ></input>
          <button
            type="submit"
            className="bg-blue-500 p-2 text-white rounded-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
