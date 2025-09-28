import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../api/api";

export default function DocsPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);

  const pollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await Api.getFiles({ limit: 100 });
        const mapped = (data.files || []).map((f) => ({
          id: f._id,
          title: f.filerealname || f.uuid_filename || "Untitled",
          snippet: f.file_uuid || f.task_id || "",
          modified: f.created_at ? new Date(f.created_at).toLocaleString() : "",
          owner: "You",
          fileSize: f.file_size,
          status: f.status,
          raw: f,
        }));
        if (mounted) setDocs(mapped);
      } catch (err) {
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.snippet || "").toLowerCase().includes(q) ||
        (d.owner || "").toLowerCase().includes(q)
    );
  }, [query, docs]);

  function removeDoc(id) {
    setDocs((s) => s.filter((d) => d.id !== id));
  }


  function handleOpen(collectionId) {
    if (!collectionId) return;
    navigate(`/chat/${encodeURIComponent(collectionId)}`);
  }


  function onDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) setFileToUpload(file);
  }
  function onDragOver(e) {
    e.preventDefault();
  }

  async function handleUpload() {
    if (!fileToUpload) return;
    setUploading(true);
    setUploadError(null);
    setTaskStatus(null);
    try {
      const resp = await Api.uploadPdf(fileToUpload);

      const taskId = resp.task_id || resp.file_id || resp.taskId;

      if (!taskId) {
        console.warn("Upload response has no task id", resp);
        setUploading(false);
        return;
      }


      pollRef.current = setInterval(async () => {
        try {
          const s = await Api.getTaskStatus(taskId);
          setTaskStatus(s);

          const st = (s.status || "").toLowerCase();
          if (st === "success" || st === "completed" || st === "done") {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setUploading(false);
            console.log("completed", s);
            navigate(`/chat/${encodeURIComponent(s.result.file_id)}`);
          }
        } catch (err) {
          console.warn("poll error", err);
        }
      }, 5000);
    } catch (err) {
      setUploadError(err.message || String(err));
      setUploading(false);
    }
  }


  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-full">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your documents..."
                className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-4 pr-12 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Upload PDF
            </button>

            <button
              onClick={() => {
                alert('This demo only provides document grid.');
              }}
              className="hidden md:inline-flex items-center gap-2 rounded-md bg-white border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              Grid
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <section className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-600">Your documents</h2>
            <p className="text-xs text-gray-500">Previous Files: {docs.length} items</p>
          </div>
          <div className="text-sm text-gray-500">
            {loading ? "Loading..." : error ? `Error: ${error}` : `${docs.length} files fetched`}
          </div>
        </section>

        <section>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-600">No documents match — try a different search or upload a PDF.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((d) => (
                <article
                  key={d.id}
                  className="relative rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">{d.title}</h3>
                      <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                        {d.snippet || "Blank document"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end text-xs text-gray-400">
                      <span>{new Date(d.raw.created_at).toLocaleString()}</span>
                      <div className="mt-2 flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="h-7 w-7 p-2 bg-indigo-100 rounded-full text-indigo-700"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleOpen(d.raw.file_uuid)}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Open
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => {
            if (!uploading) setShowUploadModal(false);
          }} />

          <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-medium">Upload PDF</h3>
            <p className="mt-1 text-sm text-gray-500">Drag & drop a PDF here or choose a file to upload.</p>

            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="mt-4 flex h-40 items-center justify-center rounded-md border-2 border-dashed border-gray-200 bg-gray-50 p-4"
            >
              <div className="text-center">
                <p className="text-sm text-gray-600">{fileToUpload ? fileToUpload.name : "Drop a PDF here"}</p>
                <p className="text-xs text-gray-400 mt-2">Only PDF files are accepted.</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="cursor-pointer rounded-md bg-white border px-3 py-2 text-sm">
                Choose file
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (f) setFileToUpload(f);
                  }}
                />
              </label>

              <button
                onClick={handleUpload}
                disabled={uploading || !fileToUpload}
                className={`rounded-md px-4 py-2 text-sm text-white ${uploading || !fileToUpload ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>

              <button
                onClick={() => {
                  if (!uploading) {
                    setFileToUpload(null);
                    setShowUploadModal(false);
                  }
                }}
                className="rounded-md px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>

            {uploadError && <p className="mt-3 text-sm text-red-500">{uploadError}</p>}

            {uploading && (
              <div className="mt-4 flex items-center gap-3">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none" strokeDasharray="31.4 31.4" />
                </svg>
                <div>
                  <div className="text-sm">Processing task: {taskStatus?.task_id || '...'} </div>
                  <div className="text-xs text-gray-500">Status: {taskStatus?.status || 'pending'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
