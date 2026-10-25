import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 사진·견적서는 서버에 저장하지 않는다. 응답 헤더로 캐시도 막는다.
  async headers() {
    return [{ source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] }];
  },
};

export default nextConfig;
