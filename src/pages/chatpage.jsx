import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Api from '../api/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatPage() {
    const { collectionId } = useParams();

    const [messages, setMessages] = useState([
        {
            id: 'sys-1',
            role: 'assistant',
            text: 'Hi — I am your assistant. Ask me anything about the doc..'
        }
    ]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    
    useEffect(() => {
        if (!collectionId) {
            setMessages((s) => [
                ...s,
                {
                    id: `sys-no-col-${Date.now()}`,
                    role: 'assistant',
                    text: 'No collection selected. Open a collection from the docs page to start a chat.'
                }
            ]);
        }
        
    }, [collectionId]);

    async function send() {
        if (!input.trim()) return;

        
        const userMsg = { id: `u-${Date.now()}`, role: 'user', text: input };
        setMessages((s) => [...s, userMsg]);
        setInput('');
        setSending(true);
        setError(null);

        if (!collectionId) {
            const errText = 'Missing collectionId in URL. Cannot query collection.';
            setError(errText);
            setMessages((s) => [
                ...s,
                { id: `e-${Date.now()}`, role: 'assistant', text: errText }
            ]);
            setSending(false);
            return;
        }

        try {
            const k = 5;
            const resp = await Api.search(collectionId, userMsg.text, k);

            
            const replyText =
                resp?.result ||
                resp?.reply ||
                resp?.answer ||
                resp?.text ||
                JSON.stringify(resp);

            const botMsg = { id: `b-${Date.now()}`, role: 'assistant', text: replyText };
            setMessages((s) => [...s, botMsg]);
        } catch (err) {
            console.error('chat error', err);
            const message = err?.message || String(err);
            setError(message);
            const errMsg = { id: `e-${Date.now()}`, role: 'assistant', text: 'Sorry — an error occurred.' };
            setMessages((s) => [...s, errMsg]);
        } finally {
            setSending(false);
        }
    }

    function onKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <header className="max-w-[90%] mx-auto mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold">Chat With File</h1>
                    <div className="text-sm text-gray-500">
                        Collection: {collectionId ? collectionId : '(none)'}
                    </div>
                </div>
            </header>

            <main className="max-w-[90%] mx-auto bg-white rounded-lg shadow p-4 flex flex-col h-[90vh]">
                <div className="flex-1 overflow-auto p-2">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                <div className="text-sm whitespace-pre-wrap">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {m.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                <div className="mt-3 border-t pt-3">
                    {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKey}
                        placeholder={collectionId ? "Type your message... (Enter to send)" : "No collection — navigate from Docs page"}
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        rows={3}
                        disabled={!collectionId}
                    />

                    <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-gray-400">Press Enter to send — Shift+Enter for newline</div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setInput(''); }} className="text-sm">Clear</button>
                            <button
                                onClick={send}
                                disabled={sending || !input.trim() || !collectionId}
                                className={`rounded-md px-4 py-2 text-sm text-white ${sending || !input.trim() || !collectionId ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {sending ? 'Loading ...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
