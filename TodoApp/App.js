import React from 'react';
import { StyleSheet, View, Platform, ListView, ActivityIndicator, AsyncStorage } from 'react-native';
import Header from './Header';
import Footer from './Footer';
import Row from './Row';

const filterItems = (filter, items) => {
  return items.filter((item) => {
    if (filter==="ALL") return true;
    if (filter==="ACTIVE") return !item.complete;
    if (filter==="COMPLETED") return item.complete;
  });
}

export default class App extends React.Component {
  constructor(props){
    super(props);
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 != r2});
    this.state = {
      loading: true,
      allComplete: false,
      value: "",
      items: [],
      dataSource: ds.cloneWithRows([]),
      filter: "ALL",
    }
  }

  componentWillMount() {
    AsyncStorage.getItem("items").then((json) => {
      try {
        const items = JSON.parse(json);
        this.setSource(items, items, {loading: false});
      } catch (e) {
        this.setState({loading: false});
      }
    });
  }

  setSource = (items, itemsDataSource, otherState = {}) => {
    this.setState({
      items,
      dataSource: this.state.dataSource.cloneWithRows(itemsDataSource),
      ...otherState
    });
    AsyncStorage.setItem("items", JSON.stringify(items));
  }

  handleUpdateText = (key, text) => {
    const newItems = this.state.items.map((item) => {
      if (item.key !== key) return item;
      return {
        ...item,
        text
      }
    });
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  handleToggleEditing = (key, editing) => {
    const newItems = this.state.items.map((item) => {
      if (item.key !== key) return item;
      return {
        ...item,
        editing
      }
    });
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  handleToggleComplete = (key, complete) => {
    const newItems = this.state.items.map((item) => {
      if (item.key !== key) return item;
      return {
        ...item,
        complete
      }
    });

    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  handleToggleAllComplete = () => {
    const complete = !this.state.allComplete;
    const newItems = this.state.items.map((item) => ({
      ...item,
      complete
    }));
    this.setSource(newItems, filterItems(this.state.filter, newItems), {allComplete: complete});
  }

  handleAddItem = () => {
    if (!this.state.value) return;
    const newItems = [
      ...this.state.items,
      {
        key: Date.now(),
        text: this.state.value,
        complete: false
      }
    ];
    this.setSource(newItems, filterItems(this.state.filter, newItems), {value: ""});
  }

  handleFilter = (filter) => {
    this.setSource(this.state.items, filterItems(filter, this.state.items), {filter});
  }

  handleRemoveItem = (key) => {
    const newItems = this.state.items.filter((item) => {
      return (item.key !== key);
    });
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  handleClearComplete = () => {
    const newItems = filterItems("ACTIVE", this.state.items);
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  render() {
    return (
      <View style={styles.container}>
        <Header 
          value={this.state.value}
          onAddItem={this.handleAddItem}
          onChange={(value) => this.setState({value})}
          onToggleAllComplete={this.handleToggleAllComplete}
        />
        <View style={styles.content}>
          <ListView 
            style={styles.list}
            enableEmptySections
            dataSource={this.state.dataSource}
            keyboardDismissMode="on-drag"
            renderRow={({key, ...value}) => {
              return (
                <Row 
                  key={key}
                  onUpdate={(text) => this.handleUpdateText(key, text)}
                  onToggleEdit={(editing) => this.handleToggleEditing(key, editing)}
                  onComplete={(complete) => this.handleToggleComplete(key, complete)}
                  onRemove={() => this.handleRemoveItem(key)}
                  {...value}
                />
              )
            }}
            renderSeparator={(sectionId, rowId) => {
              return <View key={rowId} style={styles.separator} />
            }}
          />
        </View>
        <Footer 
          count={filterItems(this.state.filter, this.state.items).length}
          filter={this.state.filter}
          onFilter={this.handleFilter}
          onClearComplete={this.handleClearComplete}
        />
        {
          this.state.loading &&
          <View style={styles.loading}>
              <ActivityIndicator 
                animating
                size="large"
              />
          </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    ...Platform.select({
      ios: {
        paddingTop: 30,
      }
    }),
  },
  loading: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,.2)"
  },
  content: {
    flex: 1,
  },
  list: {
    backgroundColor: "#fff",
  },
  separator: {
    borderWidth: 1,
    borderColor: "#f5f5f5"
  }
});
