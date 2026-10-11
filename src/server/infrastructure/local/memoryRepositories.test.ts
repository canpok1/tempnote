import { describeRepositoryContract } from "../../application/repositoryContract";
import { createMemoryRepositories, createMemoryStore } from "./memoryRepositories";

describeRepositoryContract("インメモリ", () => createMemoryRepositories(createMemoryStore()));
