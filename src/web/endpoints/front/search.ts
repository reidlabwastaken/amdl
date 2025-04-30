import express from "express";
import gitRepoInfo from "git-rev-sync";

// TODO: move this into a helper or whatever?
// i don't wanna do this for every single page lol
const hash = gitRepoInfo.short("./");
const dirty = gitRepoInfo.isDirty();

const router = express.Router();

// TODO: implement this
// TODO: show tracks
// TODO: add a download button
router.get("/", (req, res) => {
    res.render("search", {
        title: "search",
        hash: hash,
        dirty: dirty,
        query: req.query.q,
        results: [
            {
                name: "Revengeseekerz",
                artists: ["Jane Remover"],
                cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/18/cf/f6/18cff6df-c7b6-0ca1-8067-83743f6c1f8a/193436418720_coverGriffinMcMahon.jpg/592x592bb.webp"
            }
            // {
            //     name: "Carousel (An Examination of the Shadow, Creekflow, And its Life as an Afterthought) ",
            //     artists: ["Vylet Pony"],
            //     tracks: [
            //         {
            //             artists: ["Vylet Pony"],
            //             name: "Carousel"
            //         },
            //         {
            //             artists: ["Vylet Pony", "Namii"],
            //             name: "The Shadow"
            //         }
            //     ],
            //     cover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7c/f0/94/7cf09429-4942-a9cb-1287-b8bbc53a4d61/artwork.jpg/592x592bb.webp"
            // }
        ]
    });
});

export default router;
