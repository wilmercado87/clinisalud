import { signal } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

export interface TableUtils<T> {
  dataSource: MatTableDataSource<T>;
  filterValue: ReturnType<typeof signal<string>>;
  applyFilter: (event: Event) => void;
  setData: (data: T[]) => void;
  connectPaginatorSort: (paginator: MatPaginator, sort: MatSort) => void;
}

export function createTableUtils<T>(filterPredicate?: (data: T, filter: string) => boolean): TableUtils<T> {
  const filterValue = signal('');
  const dataSource = new MatTableDataSource<T>([]);

  if (filterPredicate) {
    dataSource.filterPredicate = filterPredicate;
  }

  function applyFilter(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    filterValue.set(val);
    dataSource.filter = val;
    dataSource.paginator?.firstPage();
  }

  function setData(data: T[]): void {
    dataSource.data = data;
  }

  function connectPaginatorSort(paginator: MatPaginator, sort: MatSort): void {
    dataSource.paginator = paginator;
    dataSource.sort = sort;
  }

  return {
    dataSource,
    filterValue,
    applyFilter,
    setData,
    connectPaginatorSort,
  };
}
