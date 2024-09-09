const puppeteer = require("puppeteer");
const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/profile/:username", async (req, res) => {
	const username = req.params.username;
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(`https://www.instagram.com/${username}/`, {
		waitUntil: "networkidle2",
	});

	const profile = await page.evaluate(() => {
		const userData = {};
		const scriptTag = Array.from(document.getElementsByTagName("script")).find(
			(script) => script.innerHTML.includes("window._sharedData")
		);
		if (scriptTag) {
			const jsonText = scriptTag.innerHTML.match(
				/window\._sharedData = (.+);/
			)[1];
			const jsonData = JSON.parse(jsonText);
			userData.username =
				jsonData.entry_data.ProfilePage[0].graphql.user.username;
			userData.fullName =
				jsonData.entry_data.ProfilePage[0].graphql.user.full_name;
			userData.bio = jsonData.entry_data.ProfilePage[0].graphql.user.biography;
			userData.posts =
				jsonData.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.count;
			userData.followers =
				jsonData.entry_data.ProfilePage[0].graphql.user.edge_followed_by.count;
			userData.following =
				jsonData.entry_data.ProfilePage[0].graphql.user.edge_follow.count;
			userData.profilePicture =
				jsonData.entry_data.ProfilePage[0].graphql.user.profile_pic_url_hd;
		}
		return userData;
	});

	await browser.close();
	res.json(profile);
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
