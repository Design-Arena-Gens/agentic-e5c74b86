export const metadata = {
  title: "Lava Ice Cream Video",
  description: "Generate an animated lava ice cream video",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
