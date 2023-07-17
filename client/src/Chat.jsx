import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "./UserContext.jsx";
import {uniqBy} from "lodash";
import Logo from "./Logo";
import Avatar from "./Avatar";
//import axios from "axios";

export default function Chat() {
  const [ws, wsSet] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedUserId,setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const {username, id} = useContext(UserContext);
  const divUnderMessages = useRef();

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
    console.log({event, messageData});
    if ("online" in messageData) {
      showOnlineUsers(messageData.online);
    } else if('text' in messageData){
      setMessages(prev => ([...prev, {...messageData}]));
    }
  }

  function sendMessage(event) {
    event.preventDefault();
    ws.send(JSON.stringify({
      
        recipient: selectedUserId,
        text: newMessageText,
        sender:id,
        recipient: selectedUserId,
        id: Date.now(),
      
    }));
    setNewMessageText('');
    setMessages(prev => ([...prev,{text: newMessageText, isOur: true}]));
    
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    if(div){
      div.scrollIntoView({behavior: 'smooth', block: 'end'});
    }
  }, [messages]);

  const onlinePeopleExclOurUser = {...onlineUsers};
  delete onlinePeopleExclOurUser[id];

  const messagesWithoutDupes = uniqBy(messages, 'id');

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 flex flex-col">
        <Logo />

        {Object.keys(onlineUsers).map((userId) => (
          <div onClick={() => selectedUserId(userId)} className={"border-b border-gray-100 py-2 flex items-center gap-2 cursor-pointer" + (userId === selectedUserId ? 'bg-blue-200' : '')}>
              <Avatar username={onlineUsers[userId]} userId= {userId}/>
            <span className="text-gray-700">{onlineUsers[userId]}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">
        {!selectedUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-gray-300">&larr; Select a person from the sidebar</div>
            </div>
          )}
          {!!selectedUserId && (
            
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 right-0 left-o bottom-2">
              {messagesWithoutDupes.map(message => (
                <div className={(message.sender === id ? 'text-right' : 'text-left')}>
                  <div className={"text-left inline-block p-2 my-2 rounded-md text-sm" + (message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}>
                  sender:{message.sender}<br/>
                  my id : {id}<br/>
                  {message.text}
                </div>
                </div>
              ))}
              <div ref={divUnderMessages}> </div>
            </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (<form className="flex gap-2" onSubmit={sendMessage}>
          <input
            type="text"
            value={newMessageText}
            onChange={event => setNewMessageText(event.target.value)}
            placeholder="TYPE YOUR MESSAGE"
            className="bg-white flex-grow p-2 border border-blue-200 hover:border-blue-500 rounded-sm"
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
        </form>)}
        
      </div>
    </div>
  );
}
