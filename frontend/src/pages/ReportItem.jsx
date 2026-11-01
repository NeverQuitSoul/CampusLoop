import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api";

function ReportItem() {
    const { token } = useAuth();

    const [formData, setFormData] = useState({
        reportType: "lost",
        itemName: "",
        description: "",
        location: "",
        date: "",
        contact: ""
    });

    const [image, setImage] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState("");

    useEffect(() => {
        if (!image) {
            setPreview("");
            return;
        }

        const imageUrl = URL.createObjectURL(image);
        setPreview(imageUrl);

        return () => URL.revokeObjectURL(imageUrl);
    }, [image]);

    function handleChange(event) {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    }

    function handleImageChange(event) {
        const selectedImage = event.target.files[0];

        if (!selectedImage) {
            setImage(null);
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(selectedImage.type)) {
            setMessage("Please select a JPG, PNG or WEBP image.");
            event.target.value = "";
            return;
        }

        if (selectedImage.size > 5 * 1024 * 1024) {
            setMessage("Image size must be less than 5 MB.");
            event.target.value = "";
            return;
        }

        setMessage("");
        setImage(selectedImage);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setLoading(true);
        setMessage("");

        const data = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });

        if (image) {
            data.append("image", image);
        }

        try {
            const response = await fetch(`${API_URL}/api/items`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: data
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Could not submit report."
                );
            }

            setMessage("Report submitted successfully!");

            setFormData({
                reportType: "lost",
                itemName: "",
                description: "",
                location: "",
                date: "",
                contact: ""
            });

            setImage(null);
            event.target.reset();

        } catch (error) {
            setMessage(
                error.message || "Could not connect to the server."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="report-form">
            <h1>Report an Item</h1>

            <form onSubmit={handleSubmit}>
                <label>Report Type</label>

                <select
                    name="reportType"
                    value={formData.reportType}
                    onChange={handleChange}
                    required
                >
                    <option value="lost">Lost Item</option>
                    <option value="found">Found Item</option>
                </select>

                <label>Item Name</label>

                <input
                    type="text"
                    name="itemName"
                    placeholder="Enter item name"
                    value={formData.itemName}
                    onChange={handleChange}
                    required
                />

                <label>Description</label>

                <textarea
                    name="description"
                    placeholder="Describe the item"
                    value={formData.description}
                    onChange={handleChange}
                    required
                />

                <label>Location</label>

                <input
                    type="text"
                    name="location"
                    placeholder="Where was it lost or found?"
                    value={formData.location}
                    onChange={handleChange}
                    required
                />

                <label>Date</label>

                <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                />

                <label>Contact Information</label>

                <input
                    type="text"
                    name="contact"
                    placeholder="Enter contact information"
                    value={formData.contact}
                    onChange={handleChange}
                    required
                />

                <label>Upload Item Image (Optional)</label>

                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                />

                {preview && (
                    <div className="image-preview">
                        <p>Image Preview</p>

                        <img
                            src={preview}
                            alt="Selected item preview"
                        />
                    </div>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Report"}
                </button>
            </form>

            {message && (
                <p className="form-message">{message}</p>
            )}
        </div>
    );
}

export default ReportItem;