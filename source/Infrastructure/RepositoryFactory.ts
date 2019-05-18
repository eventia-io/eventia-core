import { Repository } from "../DomainDrivenDesign/Repository";


export class RepositoryFactory {

    private static repositoryMap = new Map<string, Repository<any>>();

    public static register(aggregateClassName: string, repository: Repository<any>): void {
        this.repositoryMap.set(aggregateClassName, repository);
    }

    public static get(aggregateClassName: string): Repository<any> {
        const repository = this.repositoryMap.get(aggregateClassName);

        if (repository === undefined) {
            throw new Error(`Cannot find an aggregate repository for "${aggregateClassName}"`);
        }

        return repository;
    }

}
