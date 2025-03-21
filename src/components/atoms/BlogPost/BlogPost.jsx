import React from "react";
import { cardsData } from "@src/services/getCards";
import userData from "@data/user.json";
import Title from "../Title.astro";
const BlogPost = () => {
  const posts = cardsData.posts.nodes;
  const firstPost = posts.length > 0 ? posts[0] : null;

  return (
    <>
      {firstPost ? (
        <a href={userData.blog} target="_blank" rel="noopener noreferrer nofollow" className="flex flex-col p-2 bg-btn rounded-2xl mb-3.5 max-h-[30dvh] aspect-video">

          <div className="rounded-2xl overflow-hidden group">
            <img
              alt={firstPost.featuredImage?.node.altText || "Post image"}
              src={
                firstPost.featuredImage?.node.mediaItemUrl ||
                "/img/bannerSofidev.webp"
              }
              className="w-full h-full object-cover group-hover:scale-[1.05]  group-hover:saturate-50 transition-transform duration-500 ease-in-out"
            />

          </div>


        </a>
      ) : (
        <p>No hay posts disponibles.</p>
      )}
    </>
  );
};

export default BlogPost;