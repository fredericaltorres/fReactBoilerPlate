import React from 'react';
import TodoItems from '../components/todoItems';

const Home = () => (
  <div>
    {/* <h2>Home Page!</h2> */}
    <TodoItems isLoading={false}/>
  </div>
);

export default Home;
