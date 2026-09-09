import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "crypto";
import { pinata } from "@/../utils/config";

// Demo mode: without a Pinata JWT we return a deterministic pseudo-CID so the
// full register -> verify -> mint flow works offline. Set PINATA_JWT in
// .env.local for real IPFS uploads.
const DEMO_MODE = !process.env.PINATA_JWT;

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      );
    }

    if (DEMO_MODE) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const hash = createHash("sha256")
        .update(bytes)
        .update(file.name)
        .digest("hex");
      // Base32-looking pseudo CID (CIDv1 style) for display purposes
      const cid = `bafydemo${hash.slice(0, 46)}`;
      return NextResponse.json(
        {
          IpfsHash: cid,
          cid,
          url: `https://ipfs.io/ipfs/${cid}`,
          demo: true,
        },
        { status: 200 },
      );
    }

    const uploadData = await pinata.upload.file(file);
    const url = await pinata.gateways.convert(uploadData.IpfsHash);

    return NextResponse.json(
      {
        IpfsHash: uploadData.IpfsHash,
        cid: uploadData.IpfsHash,
        url: url
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(e) },
      { status: 500 },
    );
  }
}
