'use client'
import React, { useState } from "react";

const SimpleAnimation: React.FC = () => {
    const [duration, setDuration] = useState<number>(10);
    const [url, setUrl] = useState<string>("");
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isRendering, setIsRendering] = useState<boolean>(false);

    const handlePreview = () => {
        setPreviewUrl(url);
    };

    const handleRender = async () => {
        if (!url) return;
        
        setIsRendering(true);
        setPreviewUrl("");
        
        try {
            const response = await fetch("/api/render", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    url: url,
                    durationInSeconds: duration 
                }),
            });
            
            if (!response.ok) {
                alert("Render failed.");
                return;
            }
            
            const data = await response.json();
            
            if (data.success && data.downloadUrl) {
                setPreviewUrl(data.downloadUrl);
            } else {
                alert("No render URL returned.");
            }
        } catch (error) {
            alert("Error rendering video.");
        } finally {
            setIsRendering(false);
        }
    };

    const handleDownload = () => {
        if (!previewUrl) return;
        const link = document.createElement("a");
        link.href = previewUrl;
        link.download = `website-recording-${Date.now()}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className=" w-full max-w-6xl mx-auto p-6  rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-6">Website Video Recorder</h2>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (seconds):
                </label>
                <input
                    type="number"
                    min={5}
                    max={60}
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL:
                </label>
                <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                />
            </div>

            <div className="flex gap-2 mb-6">
                <button 
                    onClick={handlePreview} 
                    disabled={!url}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Preview
                </button>
                <button 
                    onClick={handleRender} 
                    disabled={!url || isRendering}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                    {isRendering ? "Recording..." : "Record"}
                </button>
                <button 
                    onClick={handleDownload} 
                    disabled={!previewUrl}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                    Download
                </button>
            </div>

            {isRendering && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-blue-700 text-sm">🎬 Recording website... (~{duration + 5}s)</p>
                </div>
            )}

            {previewUrl && (
                <div className="mt-6">
                    {previewUrl.match(/\.(mp4|webm)$/i) ? (
                        <video 
                            src={previewUrl} 
                            controls 
                            className="w-full rounded-lg"
                        />
                    ) : (
                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full rounded-lg"
                        />
                    )}
                    <div className="mt-2 text-sm text-gray-600">
                        Duration: {duration} seconds
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleAnimation;