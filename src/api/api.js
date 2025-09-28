class Api {
    static base = "http://127.0.0.1:8000";


    static async getFiles({ limit = 100 } = {}) {
        const url = `${this.base}/files?limit=${encodeURIComponent(limit)}`;
        const res = await fetch(url, {
            method: "GET",
            headers: {
                accept: "application/json",
            },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`API error: ${res.status} ${text}`);
        }
        return res.json();
    }


    static async uploadPdf(file) {
        const url = `${this.base}/upload-pdf`;
        const fd = new FormData();
        fd.append("file", file, file.name);


        const res = await fetch(url, {
            method: "POST",
            body: fd,
        });


        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Upload error: ${res.status} ${text}`);
        }


        return res.json();
    }


    static async getTaskStatus(taskId) {
        const url = `${this.base}/tasks/${encodeURIComponent(taskId)}`;
        const res = await fetch(url, {
            method: "GET",
            headers: { accept: "application/json" },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Task status error: ${res.status} ${text}`);
        }
        return res.json();
    }

    static async search(collectionId, query, k = 5) {
        const url = `${this.base}/search/${encodeURIComponent(collectionId)}`;
        const body = { query, k };

        const res = await fetch(url, {
            method: "POST",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Search error: ${res.status} ${text}`);
        }

        return res.json();
    }
}


export default Api;