import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_ADS_CLIENT_ID,
    process.env.GOOGLE_ADS_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// colle ton code ici
const code = "4/0AeoWuM9vKnCEjCQvc7FTu_pOfXKz_bXe3BKJS5U2MnN4U7Glcp2IW1dyiPV1dLHRPa0hQg";

async function run() {
    try {

        const { tokens } =
            await oauth2Client.getToken(code);

        console.log("\nACCESS TOKEN:\n");
        console.log(tokens.access_token);

        console.log("\nREFRESH TOKEN:\n");
        console.log(tokens.refresh_token);

    } catch (err) {
        console.log(err);
    }
}

run();