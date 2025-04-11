"use client";

import { formatDate } from "@/lib/format";
import LikeButton from "./like-icon";
import { togglePostLikeStatus } from "@/actions/posts";
import { useOptimistic } from "react";
import Image from "next/image";

function imageLoader(config) {
  const urlStart = config.src.split("upload/")[0];
  const urlEnd = config.src.split("upload/")[1];
  const transformations = `w_200,q_${config.quality}`;
  const url = `${urlStart}upload/${transformations}/${urlEnd}`;
  return url;
}

function Post({ post, action }) {
  return (
    <article className="post">
      <div className="post-image">
        <Image
          loader={imageLoader}
          // fill // due to warning we are adding height and width property but they are controlled by the css value
          height={120}
          width={200}
          src={post.image}
          alt={post.title}
          quality={50}
        />
      </div>
      <div className="post-content">
        <header>
          <div>
            <h2>{post.title}</h2>
            <p>
              Shared by {post.userFirstName} on{" "}
              <time dateTime={post.createdAt}>
                {formatDate(post.createdAt)}
              </time>
            </p>
          </div>
          <form
            action={action.bind(null, post.id)}
            className={post.isLiked ? "liked" : ""}
          >
            <LikeButton />
          </form>
        </header>
        <p>{post.content}</p>
      </div>
    </article>
  );
}

export default function Posts({ posts }) {
  const [optimisticPosts, updateOptimisticPosts] = useOptimistic(
    posts,
    (prevState, updatedPostId) => {
      const updatedPostIndex = prevState.findIndex(
        (post) => post.id === updatedPostId
      );

      if (updatedPostIndex === -1) {
        return prevState;
      }

      const updatedPost = { ...prevState[updatedPostIndex] };
      updatedPost.likes = updatedPost.likes + (updatedPost.isLiked ? -1 : 1);
      updatedPost.isLiked = !updatedPost.isLiked;
      const newPosts = [...prevState];
      newPosts[updatedPostIndex] = { ...updatedPost };
      return newPosts;
    }
  );

  if (!optimisticPosts || optimisticPosts.length === 0) {
    return <p>There are no posts yet. Maybe start sharing some?</p>;
  }

  async function updatedPost(postId) {
    updateOptimisticPosts(postId);
    await togglePostLikeStatus(postId);
  }

  return (
    <ul className="posts">
      {optimisticPosts.map((post) => (
        <li key={post.id}>
          <Post post={post} action={updatedPost} />
        </li>
      ))}
    </ul>
  );
}
