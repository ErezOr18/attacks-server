import cors from "cors";
import express from "express";
import "reflect-metadata";
import { createConnection, getRepository } from "typeorm";
import { Attack } from "./entities/Attack";
import { textSearchByFields } from "typeorm-text-search";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { insertToDb, queryInsert } from "./helper";

// import { insertToDb } from "./helper";
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const port = process.env.PORT || 5000;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const typeOrmOptions: PostgresConnectionOptions = {
    type: "postgres",
    url: databaseUrl,
    entities: [Attack],
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
    // logging: true,
    // logger: "file",
  };
  console.log("");
  const conn = await createConnection(typeOrmOptions);
  console.log("connection to database: ", conn.isConnected);
  // await getRepository(Attack).delete({});
  // await insertToDb();
  // await queryInsert();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/attacks", async (_req, res) => {
    const attacks = await getRepository(Attack).find({});
    res.json(attacks);
  });

  app.post("/api/attacks", async (req, res) => {
    console.log(req.url);
    const take = req.query.take ? parseInt(req.query.take.toString()) : 10;
    const skip = req.query.skip ? parseInt(req.query.skip.toString()) : 0;
    const keyword: string = (req.query.keyword as string) || "";
    // const condition = {
    //   description: Like(String("%" + keyword + "%")),
    // };
    // const [result, total] = await getRepository(Attack).findAndCount({
    //   where: condition,
    //   order: { name: "DESC" },
    //   take: take,
    //   skip: skip,
    // });
    const query = await getRepository(Attack).createQueryBuilder("attack");
    textSearchByFields<Attack>(query, keyword, ["description"]);
    const [result, total] = await query.take(take).skip(skip).getManyAndCount();
    res.send({ data: result, count: total });
  });
  app.listen(port, () =>
    console.log(`server is now listening on port: ${port}`)
  );
}

main().catch((err) => console.error(err));
