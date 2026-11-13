export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Gunakan POST." });
  }

  try {
    const username = String(req.body?.username || "").trim();

    if (!username || username.length > 20) {
      return res.status(400).json({ error: "Username Roblox tidak valid." });
    }

    const lookupResponse = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false
      })
    });

    if (!lookupResponse.ok) {
      return res.status(502).json({ error: "Layanan Roblox sedang tidak dapat dihubungi." });
    }

    const lookupData = await lookupResponse.json();
    const user = lookupData?.data?.[0];

    if (!user) {
      return res.status(404).json({ error: "Username Roblox tidak ditemukan." });
    }

    let avatarUrl = null;

    try {
      const avatarResponse = await fetch(
        "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" +
        encodeURIComponent(user.id) +
        "&size=150x150&format=Png&isCircular=true"
      );

      if (avatarResponse.ok) {
        const avatarData = await avatarResponse.json();
        avatarUrl = avatarData?.data?.[0]?.imageUrl || null;
      }
    } catch (_) {
      // Avatar opsional; hasil pencarian akun tetap bisa digunakan.
    }

    return res.status(200).json({
      id: user.id,
      username: user.name,
      displayName: user.displayName || user.name,
      avatarUrl
    });
  } catch (error) {
    return res.status(500).json({ error: "Terjadi kesalahan saat memeriksa username." });
  }
}
