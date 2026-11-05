/** One object per member. JSON remains the storage/API representation. */
export class Member {
  /** @param {import('../contracts/models.ts').Person} record */
  constructor(record) { Object.assign(this, record); }

  getPapers(papers) {
    return papers.filter(paper => paper.authors.some(author => author.personId === this.id))
      .sort((a, b) => b.year - a.year);
  }
}

/** One object per paper. pageUrl is an explicit link, not an inferred title URL. */
export class Paper {
  /** @param {import('../contracts/models.ts').Publication} record */
  constructor(record) { Object.assign(this, record); }
}
