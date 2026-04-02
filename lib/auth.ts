import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || "default_super_secret_for_cluedo";

export function signJwt(payload: object) {
    const header = { alg: "HS256", typ: "JWT" };
    const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(`${b64Header}.${b64Payload}`)
        .digest("base64url");
    return `${b64Header}.${b64Payload}.${signature}`;
}

export function verifyJwt(token: string): any {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const [b64Header, b64Payload, signature] = parts;
        const expectedSignature = crypto
            .createHmac("sha256", SECRET)
            .update(`${b64Header}.${b64Payload}`)
            .digest("base64url");
        if (signature !== expectedSignature) return null;
        return JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf-8"));
    } catch (err) {
        return null;
    }
}
