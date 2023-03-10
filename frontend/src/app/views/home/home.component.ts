import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatListOption } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ItemProps } from './home.model';
import { HomeService } from './home.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit{
  selectedItems: ItemProps[] = [];
  listItemMap = {
    db1: [],
    db2: [],
  };
  items: ItemProps[] = [];
  nameControl = new FormControl('',[Validators.required, Validators.minLength(1)]);
  databaseForm = new FormGroup({
    db1: new FormControl(true),
    db2: new FormControl(false)
  });
  formSubmitedd = false;
  sortLabels = {
    database: 'Banco',
    name: 'Nome',
    createdAt: 'Data de criação'
  }
  filtersMap = {
    none: 'Nenhum filtro',
    db1: 'Apenas Banco 1',
    db2: 'Apenas Banco 2',
    duplicated: 'Em ambos os bancos'
  }
  selectedFilter = 'none';
  sortedBy = {
    key: 'database',
    reverse: false
  }
  loading = false;

  constructor(
    private homeService: HomeService,
    private snackBar: MatSnackBar
  ){ }

  ngOnInit(): void {
    this.loadItem('db1');
    this.loadItem('db2');
  }

  reloadItems(){
    this.items = this.listItemMap.db1.concat(this.listItemMap.db2);
    this.sort(this.sortedBy.key);
  }

  loadItem(db: string){
    this.loading = true;
    this.homeService.getItems(db).subscribe((res) => {
      if(!!res){
        res.forEach((r: ItemProps) => r.database = db);
        this.listItemMap[db] = res;
      } else {
        this.listItemMap[db] = [];
      }
      this.reloadItems();
      this.loading = false;
    });
  }

  isDatabasesInvalid(){
    return !(this.databaseForm.controls['db1'].value || this.databaseForm.controls['db2'].value) && this.formSubmitedd;
  }

  isNameInvalid() {
    return !this.nameControl.valid && this.formSubmitedd;
  }

  createItem(){
    this.formSubmitedd = true;
    if(!this.isNameInvalid() && !this.isDatabasesInvalid()){
      this.loading = true;
      let databaseMap = this.databaseForm.value;
      let databases = Object.keys(databaseMap).filter((database) => databaseMap[database]);
      let item: ItemProps = {
        name: `${this.nameControl.value}`,
        createdAt: new Date(),
        duplicated: databases.length == 2
      };

      databases.forEach((database) => this.homeService.insertItem(item, database).subscribe(
        () => {
          this.snackBar.open('Item inserido com sucesso', 'OK', {
            panelClass: ['snack-success'],
            duration: 1000
          });
          this.loadItem(database);
          this.nameControl.reset();
          this.loading = this.formSubmitedd = false;
        },
        () => {
          this.snackBar.open('Erro ao inserir item', 'OK', {
            panelClass: ['snack-fail'],
            duration: 1000
          });
        }
      ));
    } else {
      this.nameControl.updateValueAndValidity();
      this.databaseForm.updateValueAndValidity();
    }
  }

  removeItems(){
    this.selectedItems.forEach(
      (selected) => {
        this.loading = true;
        this.homeService.deleteItem(selected.id!, selected.database!).subscribe(() => {
          this.loadItem(selected.database!);
          this.loading = false;
        });
      }
    );
    this.selectedItems = [];
  }

  sort(key: string){
    this.loading = true;
    this.sortedBy.key = key;
    if(this.sortedBy.reverse){
      this.items = this.items.sort((a: any, b: any) => {
        if (a[key] > b[key]) {
          return -1;
        } else if (a[key] < b[key]) {
            return 1;
        }
        return 0;
      });
    }else{
      this.items = this.items.sort((a: any, b: any) => {
        if (a[key] > b[key]) {
          return 1;
        } else if (a[key] < b[key]) {
            return -1;
        }
        return 0;
      });
    }
    this.loading = false;
  }

  reverseSort(){
    this.sortedBy.reverse = !this.sortedBy.reverse;
    this.sort(this.sortedBy.key);
  }

  filter(key: any, value?: any){
    this.loading = true;
    this.selectedFilter = key != 'database'? key: value;
    this.reloadItems();
    if(key != 'none'){
      this.items = this.items.filter((item) => item[key] == value);
    }
    this.loading = false;
  }

  onSelection(event: any, selectedItems: MatListOption[]){
    this.selectedItems = selectedItems.map((item) => item.value);
  }
}
