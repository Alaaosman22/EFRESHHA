import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/scrape", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2" });

        const productData = await page.evaluate(() => {
            const title =
                document.querySelector("h1")?.innerText?.trim() ||
                document.querySelector("title")?.innerText?.trim() ||
                "No title found";

            const description =
                document.querySelector("meta[name='description']")?.content ||
                document.querySelector("meta[property='og:description']")?.content ||
                "No description found";

            const images = Array.from(document.querySelectorAll("img"))
                .map(img => img.src)
                .filter(src => src.startsWith("http"));

            return { title, description, images };
        });

        await browser.close();
        res.json(productData);

    } catch (error) {
        console.error("Scraping error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
