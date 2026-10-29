
import { useState } from "react";

function ReportItem() {
    const [formData, setFormData] = useState({
        reportType: "lost",
        itemName: "",
        description: "",
        location: "",
        date: "",
        contact: ""
    });

    const [message, setMessage] = useState("");

    function handleChange(event) {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("Submitting...");

        try {
            const response = await fetch(
                "http://localhost:5000/api/items",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
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
        } catch (error) {
            setMessage(error.message || "Could not connect to the server.");
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
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    required
                />

                <label>Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                />

                <label>Location</label>
                <input
                    name="location"
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
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    required
                />

                <button type="submit">Submit Report</button>
            </form>

            <p>{message}</p>
        </div>
    );
}

export default ReportItem;
