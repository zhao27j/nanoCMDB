import { createApp } from "https://unpkg.com/petite-vue?module";
createApp(
    {
        fields: {
            name: {
                lavel: "Name",
                value: "",
            },
            email: {
                label: "Email",
                value: "",
            },
            address: {
                label: "Address",
                value: "",
            },
            state: {
                label: "State",
                value: "",
            },
            zip: {
                label: "Zip",
                value: "",
            },
            donationAmount: {
                label: "Donation Amount",
                value: "",
            },
        },
        steps: [
            ["name", "email",],
            ["address", "city", "state", "zip",],
            ["donationAmount", ]
        ]
    }
).mount("#multi-step-form");