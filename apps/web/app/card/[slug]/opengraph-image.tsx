import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function CardOpenGraphImage({ params }: { params: { slug: string } }) {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #FFF8EA, #D9E7CB)",
          color: "#0C3B2E",
          display: "flex",
          fontSize: 72,
          fontWeight: 900,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-0.05em",
          width: "100%"
        }}
      >
        Tournament Card / {params.slug}
      </div>
    ),
    size
  );
}
